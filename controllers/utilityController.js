import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Utility from '../models/utilityModel.js';

export const getAllUtilities = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, type, propertyId, startDate, endDate } = req.query;
  const query = {};
  if (type) query.type = type;
  if (propertyId) query.property = propertyId;
  if (startDate || endDate) {
    query.billingPeriod = {};
    if (startDate) query.billingPeriod.start = { $gte: new Date(startDate) };
    if (endDate) query.billingPeriod.end = { $lte: new Date(endDate) };
  }

  const skip = (page - 1) * limit;
  const utilities = await Utility.find(query).populate('property').sort({ 'billingPeriod.start': -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Utility.countDocuments(query);
  ApiResponse.paginated(res, utilities, { page: parseInt(page), limit: parseInt(limit), total }, 'Utilities fetched successfully');
});

export const getUtilityById = asyncHandler(async (req, res) => {
  const utility = await Utility.findById(req.params.id).populate('property');
  if (!utility) return ApiResponse.error(res, 'Utility not found', 404);
  ApiResponse.success(res, utility, 'Utility fetched successfully');
});

export const createUtility = asyncHandler(async (req, res) => {
  const utility = await Utility.create(req.body);
  await utility.populate('property');
  ApiResponse.success(res, utility, 'Utility created successfully', 201);
});

export const updateUtility = asyncHandler(async (req, res) => {
  const utility = await Utility.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!utility) return ApiResponse.error(res, 'Utility not found', 404);
  ApiResponse.success(res, utility, 'Utility updated successfully');
});

export const deleteUtility = asyncHandler(async (req, res) => {
  const utility = await Utility.findByIdAndDelete(req.params.id);
  if (!utility) return ApiResponse.error(res, 'Utility not found', 404);
  ApiResponse.success(res, null, 'Utility deleted successfully');
});
