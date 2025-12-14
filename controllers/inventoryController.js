import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Inventory from '../models/inventoryModel.js';

export const getAllInventory = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, category, propertyId } = req.query;
  const query = {};
  if (category) query.category = category;
  if (propertyId) query.property = propertyId;

  const skip = (page - 1) * limit;
  const inventory = await Inventory.find(query).populate('property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Inventory.countDocuments(query);
  ApiResponse.paginated(res, inventory, { page: parseInt(page), limit: parseInt(limit), total }, 'Inventory fetched successfully');
});

export const getInventoryById = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findById(req.params.id).populate('property');
  if (!inventory) return ApiResponse.error(res, 'Inventory not found', 404);
  ApiResponse.success(res, inventory, 'Inventory fetched successfully');
});

export const createInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.create(req.body);
  await inventory.populate('property');
  ApiResponse.success(res, inventory, 'Inventory created successfully', 201);
});

export const updateInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!inventory) return ApiResponse.error(res, 'Inventory not found', 404);
  ApiResponse.success(res, inventory, 'Inventory updated successfully');
});

export const deleteInventory = asyncHandler(async (req, res) => {
  const inventory = await Inventory.findByIdAndDelete(req.params.id);
  if (!inventory) return ApiResponse.error(res, 'Inventory not found', 404);
  ApiResponse.success(res, null, 'Inventory deleted successfully');
});
