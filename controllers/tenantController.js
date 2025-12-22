import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Tenant from '../models/tenantModel.js';
import Room from '../models/roomModel.js';
import Property from '../models/propertyModel.js';
import PgOwner from '../models/pgOwnerModel.js';
import Payment from '../models/paymentModel.js';
import { syncTenantPaymentStatus } from './financeController.js';
import { sendTenantWelcomeEmail, sendTenantDepartureEmail } from '../utils/emailService.js';

// @desc    Get all Tenants
// @route   GET /api/tenants
// @access  Private
export const getAllTenants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, paymentStatus, propertyId, ownerId, occupation } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (propertyId) query.property = propertyId;
  if (occupation) query.occupation = occupation;

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    // Only admins can filter by arbitrary ownerId
    query.owner = ownerId;
  }

  const skip = (page - 1) * limit;
  const tenants = await Tenant.find(query)
    .populate('property', 'name address city')
    .populate('owner', 'name email')
    .populate('room', 'roomNumber roomType')
    .populate('mealPlan', 'name price')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Tenant.countDocuments(query);

  ApiResponse.paginated(res, tenants, { page: parseInt(page), limit: parseInt(limit), total }, 'Tenants fetched successfully');
});

// @desc    Get Tenant by ID
// @route   GET /api/tenants/:id
// @access  Private
export const getTenantById = asyncHandler(async (req, res) => {
  // Sync before fetching to ensure status is 100% accurate
  await syncTenantPaymentStatus(req.params.id);

  const tenant = await Tenant.findById(req.params.id)
    .populate('property', 'name address city')
    .populate('owner', 'name email phone')
    .populate('room', 'roomNumber roomType rent')
    .populate('mealPlan', 'name price');

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Tenant fetched successfully');
});

// @desc    Create Tenant
// @route   POST /api/tenants
// @access  Private
export const createTenant = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }

  // Validate room capacity if room is assigned
  if (req.body.room) {
    const room = await Room.findById(req.body.room);
    if (!room) {
      return ApiResponse.error(res, 'Room not found', 404);
    }
    // Security check for room ownership
    if (req.user && req.user.role === 'pg_owner' && room.owner.toString() !== req.user._id.toString()) {
        return ApiResponse.error(res, 'Invalid room selection', 403);
    }
    if (room.status === 'Occupied' || room.currentOccupancy >= room.capacity) {
      return ApiResponse.error(res, 'Room is already at full capacity or occupied', 400);
    }
  }

  const tenant = await Tenant.create(req.body);
  
  await tenant.populate([
    { path: 'property', select: 'name address' },
    { path: 'owner', select: 'name email' },
    { path: 'room', select: 'roomNumber roomType' }
  ]);

  // Update room occupancy
  if (req.body.room) {
    const room = await Room.findById(req.body.room);
    const newOccupancy = room.currentOccupancy + 1;
    const updateData = { currentOccupancy: newOccupancy };
    
    // Automatically update status if full
    if (newOccupancy >= room.capacity) {
        updateData.status = 'Occupied';
    }
    
    await Room.findByIdAndUpdate(req.body.room, updateData);
  }

  // Auto-generate financial records
  const { securityDeposit, depositStatus, depositDueDate, rentAmount, paymentStatus, joiningDate, property, owner } = req.body;

  // 1. Create Security Deposit record if amount > 0
  if (securityDeposit > 0) {
      const depStatus = (depositStatus || 'pending').toLowerCase();
      await Payment.create({
          owner,
          tenant: tenant._id,
          property,
          amount: securityDeposit,
          category: 'Security Deposit',
          status: depStatus,
          paidDate: depStatus === 'paid' ? new Date() : undefined,
          dueDate: depositDueDate || joiningDate || new Date(),
          description: `Initial Security Deposit`
      });
  }

  // 2. Create Initial Rent record for joining month
  if (rentAmount > 0) {
      const pStatus = (paymentStatus || 'pending').toLowerCase();
      await Payment.create({
          owner,
          tenant: tenant._id,
          property,
          amount: rentAmount,
          category: 'Rent',
          status: pStatus,
          paidDate: pStatus === 'paid' ? new Date() : undefined,
          dueDate: joiningDate || new Date(),
          description: `Rent for ${new Date(joiningDate || new Date()).toLocaleString('default', { month: 'long', year: 'numeric' })}`
      });
  }

  // 3. Sync final status
  await syncTenantPaymentStatus(tenant._id);

  // Send Welcome Email
  try {
      await sendTenantWelcomeEmail(tenant);
  } catch (emailError) {
      console.error('Failed to send welcome email:', emailError);
      // We don't block creation if email fails
  }

  ApiResponse.success(res, tenant, 'Tenant created successfully', 201);
});

// @desc    Update Tenant
// @route   PUT /api/tenants/:id
// @access  Private
export const updateTenant = asyncHandler(async (req, res) => {
  const { room: newRoomId } = req.body;
  
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const currentTenant = await Tenant.findOne(query);

  if (!currentTenant) {
      return ApiResponse.error(res, 'Tenant not found or unauthorized', 404);
  }

  // Handle Room Change
  if (newRoomId && newRoomId !== currentTenant.room?.toString()) {
      const newRoom = await Room.findById(newRoomId);
      if (!newRoom) {
          return ApiResponse.error(res, 'New room not found', 404);
      }
      
      // Security check for new room ownership
      if (req.user && req.user.role === 'pg_owner' && newRoom.owner.toString() !== req.user._id.toString()) {
          return ApiResponse.error(res, 'Invalid room selection', 403);
      }

      if (newRoom.status === 'Occupied' || newRoom.currentOccupancy >= newRoom.capacity) {
          return ApiResponse.error(res, 'New room is already at full capacity or occupied', 400);
      }

      // Decrement old room occupancy
      if (currentTenant.room) {
          const oldRoom = await Room.findById(currentTenant.room);
          if (oldRoom) {
              const oldOccupancy = Math.max(0, oldRoom.currentOccupancy - 1);
              await Room.findByIdAndUpdate(currentTenant.room, { 
                  currentOccupancy: oldOccupancy,
                  status: 'Available' // Always becomes available if someone leaves (assuming it was Occupied)
              });
          }
      }

      // Increment new room occupancy
      const newOccupancy = newRoom.currentOccupancy + 1;
      const updateData = { currentOccupancy: newOccupancy };
      if (newOccupancy >= newRoom.capacity) {
          updateData.status = 'Occupied';
      }
      await Room.findByIdAndUpdate(newRoomId, updateData);
  }

  const tenant = await Tenant.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
    .populate('property owner room mealPlan');

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Tenant updated successfully');
});

// @desc    Delete Tenant
// @route   DELETE /api/tenants/:id
// @access  Private
export const deleteTenant = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const tenant = await Tenant.findOne(query);

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found or unauthorized', 404);
  }

  // Update room occupancy
  if (tenant.room) {
    const room = await Room.findById(tenant.room);
    if (room) {
        const newOccupancy = Math.max(0, room.currentOccupancy - 1);
        await Room.findByIdAndUpdate(tenant.room, { 
            currentOccupancy: newOccupancy,
            status: 'Available' // Becomes available
        });
    }
  }

  // Send Departure Email before deletion
  try {
      await sendTenantDepartureEmail(tenant);
  } catch (emailErr) {
      console.error("Failed to send departure email", emailErr);
  }

  await tenant.deleteOne();

  ApiResponse.success(res, null, 'Tenant deleted successfully');
});

// @desc    Update Payment Status
// @route   PATCH /api/tenants/:id/payment-status
// @access  Private
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, lastPaymentDate, nextPaymentDue } = req.body;

  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    { paymentStatus, lastPaymentDate, nextPaymentDue },
    { new: true, runValidators: true }
  );

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Payment status updated successfully');
});

// @desc    Get Tenants by Property
// @route   GET /api/tenants/property/:propertyId
// @access  Private
export const getTenantsByProperty = asyncHandler(async (req, res) => {
  const tenants = await Tenant.find({ property: req.params.propertyId })
    .populate('room', 'roomNumber roomType')
    .sort({ createdAt: -1 });

  ApiResponse.success(res, tenants, 'Tenants fetched successfully');
});

// @desc    Bulk Create Tenants
// @route   POST /api/tenants/bulk
// @access  Private
export const bulkCreateTenants = asyncHandler(async (req, res) => {
  const { tenants, propertyId } = req.body;

  if (!Array.isArray(tenants) || tenants.length === 0) {
    return ApiResponse.error(res, 'Invalid tenants data', 400);
  }

  // Validate property exists
  const property = await Property.findById(propertyId);
  if (!property) {
    return ApiResponse.error(res, 'Property not found', 404);
  }

  const ownerId = req.user._id || req.user.id;
  if (!ownerId) {
     return ApiResponse.error(res, 'Owner not authenticated', 401);
  }

  const processedTenants = await Promise.all(tenants.map(async (tenant) => {
      let roomId = null;
      // If roomNumber provided, find the room ID
      if (tenant.roomNumber) {
          const room = await Room.findOne({ 
              property: propertyId, 
              roomNumber: tenant.roomNumber 
          });
          if (room) {
              roomId = room._id;
              // Check availability logic could be added here, but for bulk import we might force it
              // Or ideally, only assign if available.
          }
      }

      return {
          ...tenant,
          property: propertyId,
          owner: ownerId,
          room: roomId || undefined,
          paymentStatus: tenant.paymentStatus || 'Pending',
          status: 'Active'
      };
  }));

  const createdTenants = await Tenant.create(processedTenants);
  
  // Update room occupancy for assigned rooms
  for (const tenant of createdTenants) {
      if (tenant.room) {
          await Room.findByIdAndUpdate(tenant.room, { $inc: { currentOccupancy: 1 } });
      }
  }

  ApiResponse.success(res, createdTenants, `${createdTenants.length} tenants created successfully`, 201);
});
