import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Furniture from '../models/furnitureModel.js';

// @desc    Get all Furniture
// @route   GET /api/furniture
// @access  Private
export const getAllFurniture = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, condition, propertyId, roomId } = req.query;

  const query = {};
  if (search) query.name = { $regex: search, $options: 'i' };
  if (condition) query.condition = condition;
  if (propertyId) query.property = propertyId;
  if (roomId) query.room = roomId;

  const skip = (page - 1) * limit;
  const furniture = await Furniture.find(query)
    .populate('property', 'name')
    .populate('room', 'roomNumber')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Furniture.countDocuments(query);
  ApiResponse.paginated(res, furniture, { page: parseInt(page), limit: parseInt(limit), total }, 'Furniture fetched successfully');
});

// @desc    Get Furniture by ID
// @route   GET /api/furniture/:id
// @access  Private
export const getFurnitureById = asyncHandler(async (req, res) => {
  const furniture = await Furniture.findById(req.params.id).populate('property room');
  if (!furniture) return ApiResponse.error(res, 'Furniture not found', 404);
  ApiResponse.success(res, furniture, 'Furniture fetched successfully');
});

// @desc    Create Furniture
// @route   POST /api/furniture
// @access  Private
export const createFurniture = asyncHandler(async (req, res) => {
  const furniture = await Furniture.create(req.body);
  await furniture.populate('property room');
  ApiResponse.success(res, furniture, 'Furniture created successfully', 201);
});

// @desc    Update Furniture
// @route   PUT /api/furniture/:id
// @access  Private
export const updateFurniture = asyncHandler(async (req, res) => {
  const furniture = await Furniture.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!furniture) return ApiResponse.error(res, 'Furniture not found', 404);
  ApiResponse.success(res, furniture, 'Furniture updated successfully');
});

// @desc    Delete Furniture
// @route   DELETE /api/furniture/:id
// @access  Private
export const deleteFurniture = asyncHandler(async (req, res) => {
  const furniture = await Furniture.findByIdAndDelete(req.params.id);
  if (!furniture) return ApiResponse.error(res, 'Furniture not found', 404);
  ApiResponse.success(res, null, 'Furniture deleted successfully');
});
