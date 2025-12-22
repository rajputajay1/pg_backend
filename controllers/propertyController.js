import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Property from '../models/propertyModel.js';
import PgOwner from '../models/pgOwnerModel.js';

// @desc    Get all Properties
// @route   GET /api/properties
// @access  Private
export const getAllProperties = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, city, state, businessType, ownerId } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { address: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) {
    query.status = status;
  }

  if (city) {
    query.city = { $regex: city, $options: 'i' };
  }

  if (state) {
    query.state = { $regex: state, $options: 'i' };
  }

  if (businessType) {
    query.businessType = businessType;
  }

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    query.owner = ownerId;
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const properties = await Property.find(query)
    .populate('owner', 'name email phone pgName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Property.countDocuments(query);

  ApiResponse.paginated(res, properties, {
    page: parseInt(page),
    limit: parseInt(limit),
    total
  }, 'Properties fetched successfully');
});

// @desc    Get Properties by Owner
// @route   GET /api/properties/owner/:ownerId
// @access  Private
export const getPropertiesByOwner = asyncHandler(async (req, res) => {
  const properties = await Property.find({ owner: req.params.ownerId })
    .sort({ createdAt: -1 });

  ApiResponse.success(res, properties, 'Properties fetched successfully');
});

// @desc    Get Property by ID
// @route   GET /api/properties/:id
// @access  Private
export const getPropertyById = asyncHandler(async (req, res) => {
  const property = await Property.findById(req.params.id)
    .populate('owner', 'name email phone pgName');

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 404);
  }

  ApiResponse.success(res, property, 'Property fetched successfully');
});

// @desc    Create Property
// @route   POST /api/properties
// @access  Private
export const createProperty = asyncHandler(async (req, res) => {
  const {
    owner,
    name,
    address,
    city,
    state,
    businessType,
    planName,
    planPrice,
    status,
    websiteUrl,
    paymentStatus,
    totalRooms,
    occupiedRooms,
    amenities,
    description
  } = req.body;

  // Security: Force owner ID for PG Owners
  let ownerId = owner;
  if (req.user && req.user.role === 'pg_owner') {
    ownerId = req.user._id;
  }

  // Verify owner exists
  const ownerExists = await PgOwner.findById(ownerId);
  if (!ownerExists) {
    return ApiResponse.error(res, 'PG Owner not found', 404);
  }

  // Create property
  const property = await Property.create({
    owner: ownerId,
    name,
    address,
    city,
    state,
    businessType: businessType || 'PG',
    planName,
    planPrice,
    status: status || 'Active',
    websiteUrl,
    paymentStatus: paymentStatus || 'pending',
    totalRooms: totalRooms || 0,
    occupiedRooms: occupiedRooms || 0,
    amenities: amenities || [],
    description
  });

  // Populate owner details
  await property.populate('owner', 'name email phone pgName');

  ApiResponse.success(res, property, 'Property created successfully', 201);
});

// @desc    Update Property
// @route   PUT /api/properties/:id
// @access  Private
export const updateProperty = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const property = await Property.findOneAndUpdate(
    query,
    req.body,
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone pgName');

  if (!property) {
    return ApiResponse.error(res, 'Property not found or unauthorized', 404);
  }

  ApiResponse.success(res, property, 'Property updated successfully');
});

// @desc    Delete Property
// @route   DELETE /api/properties/:id
// @access  Private
export const deleteProperty = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const property = await Property.findOneAndDelete(query);

  if (!property) {
    return ApiResponse.error(res, 'Property not found or unauthorized', 404);
  }

  ApiResponse.success(res, null, 'Property deleted successfully');
});

// @desc    Update Property Status
// @route   PATCH /api/properties/:id/status
// @access  Private
export const updatePropertyStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['Active', 'Inactive', 'Pending'].includes(status)) {
    return ApiResponse.error(res, 'Invalid status value', 400);
  }

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone pgName');

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 404);
  }

  ApiResponse.success(res, property, 'Property status updated successfully');
});

// @desc    Update Room Occupancy
// @route   PATCH /api/properties/:id/occupancy
// @access  Private
export const updateRoomOccupancy = asyncHandler(async (req, res) => {
  const { totalRooms, occupiedRooms } = req.body;

  if (occupiedRooms > totalRooms) {
    return ApiResponse.error(res, 'Occupied rooms cannot exceed total rooms', 400);
  }

  const property = await Property.findByIdAndUpdate(
    req.params.id,
    { totalRooms, occupiedRooms },
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone pgName');

  if (!property) {
    return ApiResponse.error(res, 'Property not found', 404);
  }

  ApiResponse.success(res, property, 'Room occupancy updated successfully');
});
