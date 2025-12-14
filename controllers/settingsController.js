import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Settings from '../models/settingsModel.js';

export const getAllSettings = asyncHandler(async (req, res) => {
  const { propertyId, ownerId } = req.query;
  const query = {};
  if (propertyId) query.property = propertyId;
  if (ownerId) query.owner = ownerId;

  const settings = await Settings.find(query).populate('property owner');
  ApiResponse.success(res, settings, 'Settings fetched successfully');
});

export const getSettingsById = asyncHandler(async (req, res) => {
  const settings = await Settings.findById(req.params.id).populate('property owner');
  if (!settings) return ApiResponse.error(res, 'Settings not found', 404);
  ApiResponse.success(res, settings, 'Settings fetched successfully');
});

export const createSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.create(req.body);
  await settings.populate('property owner');
  ApiResponse.success(res, settings, 'Settings created successfully', 201);
});

export const updateSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!settings) return ApiResponse.error(res, 'Settings not found', 404);
  ApiResponse.success(res, settings, 'Settings updated successfully');
});

export const deleteSettings = asyncHandler(async (req, res) => {
  const settings = await Settings.findByIdAndDelete(req.params.id);
  if (!settings) return ApiResponse.error(res, 'Settings not found', 404);
  ApiResponse.success(res, null, 'Settings deleted successfully');
});
