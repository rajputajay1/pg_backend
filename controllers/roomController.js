import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Room from '../models/roomModel.js';
import Property from '../models/propertyModel.js';
import mongoose from 'mongoose';

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
  
  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    query.owner = ownerId;
  }

  const skip = (page - 1) * limit;
  const rooms = await Room.find(query)
    .populate('property', 'name address city')
    .populate('owner', 'name email')
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
    .populate('owner', 'name email phone');

  if (!room) {
    return ApiResponse.error(res, 'Room not found', 404);
  }

  ApiResponse.success(res, room, 'Room fetched successfully');
});

// @desc    Create Room
// @route   POST /api/rooms
// @access  Private
export const createRoom = asyncHandler(async (req, res) => {
  const { property, roomNumber } = req.body;

  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }

  // Check if property exists
  const propertyExists = await Property.findById(property);
  if (!propertyExists) {
    return ApiResponse.error(res, 'Property not found. Please create a property first.', 404);
  }

  // Security: Ensure owner owns the property
  if (req.user && req.user.role === 'pg_owner' && propertyExists.owner.toString() !== req.user._id.toString()) {
      return ApiResponse.error(res, 'Unauthorized to add room to this property', 403);
  }

  // Check if room number already exists for this property
  const roomExists = await Room.findOne({ property, roomNumber });
  if (roomExists) {
    return ApiResponse.error(res, 'Room number already exists in this property', 400);
  }

  const room = await Room.create(req.body);

  await room.populate([
    { path: 'property', select: 'name address' },
    { path: 'owner', select: 'name email' }
  ]);

  // Update property total rooms
  await Property.findByIdAndUpdate(property, { $inc: { totalRooms: 1 } });

  ApiResponse.success(res, room, 'Room created successfully', 201);
});

// @desc    Update Room
// @route   PUT /api/rooms/:id
// @access  Private
export const updateRoom = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const room = await Room.findOneAndUpdate(query, req.body, { new: true, runValidators: true })
    .populate('property owner');

  if (!room) {
    return ApiResponse.error(res, 'Room not found or unauthorized', 404);
  }

  ApiResponse.success(res, room, 'Room updated successfully');
});

// @desc    Delete Room
// @route   DELETE /api/rooms/:id
// @access  Private
export const deleteRoom = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const room = await Room.findOne(query);

  if (!room) {
    return ApiResponse.error(res, 'Room not found or unauthorized', 404);
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

  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const room = await Room.findOneAndUpdate(
    query,
    { status },
    { new: true, runValidators: true }
  ).populate('property owner');

  if (!room) {
    return ApiResponse.error(res, 'Room not found or unauthorized', 404);
  }

  ApiResponse.success(res, room, 'Room status updated successfully');
});

// @desc    Get Rooms by Property
// @route   GET /api/rooms/property/:propertyId
// @access  Private
export const getRoomsByProperty = asyncHandler(async (req, res) => {
  const rooms = await Room.find({ property: req.params.propertyId })
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

// @desc    Get Room Statistics
// @route   GET /api/rooms/stats
// @access  Private
export const getRoomStats = asyncHandler(async (req, res) => {
  const { propertyId } = req.query;
  const matchStage = {};
  
  if (propertyId) {
    matchStage.property = new mongoose.Types.ObjectId(propertyId);
  }

  const stats = await Room.aggregate([
    { $match: matchStage },
    {
      $group: {
        _id: '$roomType',
        total_rooms: { $sum: 1 },
        occupied_rooms: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'Occupied'] }, 1, 0] 
          } 
        },
        available_rooms: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'Available'] }, 1, 0] 
          } 
        },
        maintenance_rooms: { 
          $sum: { 
            $cond: [{ $eq: ['$status', 'Maintenance'] }, 1, 0] 
          } 
        },
        total_capacity: { $sum: '$capacity' },
        current_occupancy: { $sum: '$currentOccupancy' }
      }
    },
    {
      $project: {
        room_type: '$_id',
        total_rooms: 1,
        occupied_rooms: 1,
        available_rooms: 1,
        maintenance_rooms: 1,
        occupancy_percentage: {
          $cond: [
            { $eq: ['$total_rooms', 0] },
            0,
            { $multiply: [{ $divide: ['$occupied_rooms', '$total_rooms'] }, 100] }
          ]
        }
      }
    }
  ]);

  ApiResponse.success(res, stats, 'Room statistics fetched successfully');
});

// @desc    Bulk Create Rooms
// @route   POST /api/rooms/bulk
// @access  Private
export const bulkCreateRooms = asyncHandler(async (req, res) => {
  const { rooms, propertyId } = req.body;

  if (!Array.isArray(rooms) || rooms.length === 0) {
    return ApiResponse.error(res, 'Invalid rooms data', 400);
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

  const processedRooms = rooms.map(room => ({
    ...room,
    property: propertyId,
    owner: ownerId,
    currentOccupancy: 0
  }));

  const createdRooms = await Room.insertMany(processedRooms);
  
  // Update total rooms count in property
  await Property.findByIdAndUpdate(propertyId, { 
    $inc: { totalRooms: createdRooms.length } 
  });

  ApiResponse.success(res, createdRooms, `${createdRooms.length} rooms created successfully`, 201);
});
