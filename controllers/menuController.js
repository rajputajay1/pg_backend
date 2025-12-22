import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Menu from '../models/menuModel.js';
import Tenant from '../models/tenantModel.js';
import Property from '../models/propertyModel.js';
import { sendMealScheduleEmail } from '../utils/emailService.js';

import mongoose from 'mongoose';

const getMonday = (d) => {
  d = new Date(d);
  const day = d.getDay();
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return d;
}

// @desc    Get Menu (Weekly Schedule)
// @route   GET /api/menu
// @access  Private
export const getMenu = asyncHandler(async (req, res) => {
  const { propertyId, date } = req.query;
  const query = {};

  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  
  if (propertyId) {
      if (mongoose.isValidObjectId(propertyId)) {
        query.property = propertyId;
      } else {
        return ApiResponse.success(res, null, 'No menu found');
      }
  }

  // Calculate start of week (Monday)
  const targetDate = date ? new Date(date) : new Date();
  const startDate = getMonday(targetDate);
  
  query.startDate = startDate;

  let menu = await Menu.findOne(query);

  // If not found for THIS week, try to find the MOST RECENT one to use as a template (Copy logic)
  // But we only return it if the user specifically asked for "copy" or if we want to auto-fill?
  // Let's just return what we found. Frontend can decide to "Copy Previous" if empty.
  // Actually, for better UX: If current week is empty, maybe return the last available one in a separate field "template"?
  // Let's keep it simple: Return what exists.

  if (!menu) {
      // Return empty structure with the requested startDate so frontend knows
     return ApiResponse.success(res, { startDate, weeklyMenu: null }, 'No menu found for this week');
  }

  ApiResponse.success(res, menu, 'Menu fetched successfully');
});

// @desc    Update or Create Menu
// @route   POST /api/menu
// @access  Private
export const updateMenu = asyncHandler(async (req, res) => {
    const { propertyId, weeklyMenu, date } = req.body;

    if (!propertyId || !mongoose.isValidObjectId(propertyId)) {
        return ApiResponse.error(res, 'Valid Property ID is required', 400);
    }
    
    // Normalize date to Monday
    const targetDate = date ? new Date(date) : new Date();
    const startDate = getMonday(targetDate);

    const query = { property: propertyId, startDate: startDate };
    
    // Security check
    if (req.user && req.user.role === 'pg_owner') {
        query.owner = req.user._id;
    }

    let menu = await Menu.findOne(query);

    if (menu) {
        // Update existing
        menu.weeklyMenu = weeklyMenu;
        await menu.save();
    } else {
        // Create new
        menu = await Menu.create({
            property: propertyId,
            owner: req.user._id,
            weeklyMenu,
            startDate
        });
    }

    // Trigger Email Notification to Tenants
    try {
        const property = await Property.findById(propertyId);
        const tenants = await Tenant.find({ property: propertyId, status: 'Active' });

        if (tenants.length > 0) {
            console.log(`sending menu updates to ${tenants.length} tenants...`);
            // We don't await the loop to avoid blocking the response
            tenants.forEach(tenant => {
                sendMealScheduleEmail(tenant, menu, property).catch(err => console.error(err));
            });
        }
    } catch (emailErr) {
        console.error("Failed to trigger menu update emails", emailErr);
    }

    ApiResponse.success(res, menu, 'Menu updated successfully');
});
