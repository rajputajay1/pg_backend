import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Room from '../models/roomModel.js';
import Property from '../models/propertyModel.js';

// @desc    Get all Rooms
// @route   GET /api/rooms
// @access  Private
export const getAllRooms = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, roomType, propertyId, ownerId } = req.query;

  const query = {};

  if (search) {
    query.roomNumber = { $regex: search, $options: 'i' };
  }

  if (status) query.status = status;
  if (roomType) query.roomType = roomType;
  if (propertyId) query.property = propertyId;
  if (ownerId) query.owner = ownerId;

  const skip = (page - 1) * limit;
  const rooms = await Room.find(query)
    .populate('property', 'name address city')
    .populate('owner', 'name email')
    .populate('furniture', 'name condition')
    .sort({ property: 1, roomNumber: 1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Room.countDocuments(query);

  ApiResponse.paginated(res, rooms, { page: parseInt(page), limit: parseInt(limit), total }, 'Rooms fetched successfully');
});

// @desc    Get Room by ID
// @route   GET /api/rooms/:id
// @access  Private
export const getRoomById = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id)
    .populate('property', 'name address city')
    .populate('owner', 'name email phone')
    .populate('furniture', 'name condition quantity');

  if (!room) {
    return ApiResponse.error(res, 'Room not found', 404);
  }

  ApiResponse.success(res, room, 'Room fetched successfully');
});

// @desc    Create Room
// @route   POST /api/rooms
// @access  Private
export const createRoom = asyncHandler(async (req, res) => {
  const room = await Room.create(req.body);

  await room.populate([
    { path: 'property', select: 'name address' },
    { path: 'owner', select: 'name email' }
  ]);

  // Update property total rooms
  await Property.findByIdAndUpdate(req.body.property, { $inc: { totalRooms: 1 } });

  ApiResponse.success(res, room, 'Room created successfully', 201);
});

// @desc    Update Room
// @route   PUT /api/rooms/:id
// @access  Private
export const updateRoom = asyncHandler(async (req, res) => {
  const room = await Room.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('property owner furniture');

  if (!room) {
    return ApiResponse.error(res, 'Room not found', 404);
  }

  ApiResponse.success(res, room, 'Room updated successfully');
});

// @desc    Delete Room
// @route   DELETE /api/rooms/:id
// @access  Private
export const deleteRoom = asyncHandler(async (req, res) => {
  const room = await Room.findById(req.params.id);

  if (!room) {
    return ApiResponse.error(res, 'Room not found', 404);
  }

  // Update property total rooms
  await Property.findByIdAndUpdate(room.property, { $inc: { totalRooms: -1 } });

  await room.deleteOne();

  ApiResponse.success(res, null, 'Room deleted successfully');
});

// @desc    Update Room Status
// @route   PATCH /api/rooms/:id/status
// @access  Private
export const updateRoomStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['Available', 'Occupied', 'Maintenance', 'Reserved'].includes(status)) {
    return ApiResponse.error(res, 'Invalid status value', 400);
  }

  const room = await Room.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('property owner');

  if (!room) {
    return ApiResponse.error(res, 'Room not found', 404);
  }

  ApiResponse.success(res, room, 'Room status updated successfully');
});

// @desc    Get Rooms by Property
// @route   GET /api/rooms/property/:propertyId
// @access  Private
export const getRoomsByProperty = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ property: req.params.propertyId })
    .populate('furniture', 'name condition')
    .sort({ roomNumber: 1 });

  ApiResponse.success(res, rooms, 'Rooms fetched successfully');
});

// @desc    Get Available Rooms
// @route   GET /api/rooms/available/:propertyId
// @access  Private
export const getAvailableRooms = asyncHandler(async (req, res) => {
  const rooms = await Room.find({
    property: req.params.propertyId,
    status: 'Available',
    $expr: { $lt: ['$currentOccupancy', '$capacity'] }
  }).sort({ roomNumber: 1 });

  ApiResponse.success(res, rooms, 'Available rooms fetched successfully');
});
