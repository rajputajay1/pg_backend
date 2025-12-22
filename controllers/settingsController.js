import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Settings from '../models/settingsModel.js';

export const getAllSettings = asyncHandler(async (req, res) => {
  const { propertyId, ownerId } = req.query;
  const query = {};
  if (propertyId) query.property = propertyId;
  
  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    query.owner = ownerId;
  }

  const settings = await Settings.find(query).populate('property owner');
  ApiResponse.success(res, settings, 'Settings fetched successfully');
});

export const getSettingsById = asyncHandler(async (req, res) => {
  const settings = await Settings.findById(req.params.id).populate('property owner');
  if (!settings) return ApiResponse.error(res, 'Settings not found', 404);
  
  // Security check
  if (req.user && req.user.role === 'pg_owner' && settings.owner._id.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized', 403);
  }
  
  ApiResponse.success(res, settings, 'Settings fetched successfully');
});

export const createSettings = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  
  // Verify ownership of property if passed
  if (req.body.property && req.user && req.user.role === 'pg_owner') {
      const property = await Property.findOne({ _id: req.body.property, owner: req.user._id });
      if (!property) return ApiResponse.error(res, 'Invalid property', 403);
  }

  const settings = await Settings.create(req.body);
  await settings.populate('property owner');
  ApiResponse.success(res, settings, 'Settings created successfully', 201);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const settings = await Settings.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!settings) return ApiResponse.error(res, 'Settings not found or unauthorized', 404);
  ApiResponse.success(res, settings, 'Settings updated successfully');
});

export const deleteSettings = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const settings = await Settings.findOneAndDelete(query);
  if (!settings) return ApiResponse.error(res, 'Settings not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Settings deleted successfully');
});
