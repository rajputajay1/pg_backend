import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Staff from '../models/staffModel.js';
import bcrypt from 'bcryptjs';

// @desc    Get all Staff
// @route   GET /api/staff
// @access  Private
export const getAllStaff = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, role, propertyId, ownerId, isActive } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (role) query.role = role;
  if (propertyId) query.property = propertyId;
  if (ownerId) query.owner = ownerId;
  if (isActive !== undefined) query.isActive = isActive === 'true';

  const skip = (page - 1) * limit;
  const staff = await Staff.find(query)
    .populate('owner', 'name email')
    .populate('property', 'name address')
    .populate('assignedRooms', 'roomNumber')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Staff.countDocuments(query);

  ApiResponse.paginated(res, staff, { page: parseInt(page), limit: parseInt(limit), total }, 'Staff fetched successfully');
});

// @desc    Get Staff by ID
// @route   GET /api/staff/:id
// @access  Private
export const getStaffById = asyncHandler(async (req, res) => {
  const staff = await Staff.findById(req.params.id)
    .populate('owner', 'name email phone')
    .populate('property', 'name address city')
    .populate('assignedRooms', 'roomNumber roomType');

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found', 404);
  }

  ApiResponse.success(res, staff, 'Staff fetched successfully');
});

// @desc    Create Staff
// @route   POST /api/staff
// @access  Private
export const createStaff = asyncHandler(async (req, res) => {
  let { password, ...staffData } = req.body;

  // If password is not provided, use phone number as default or fallback
  if (!password) {
    if (staffData.phone) {
      password = staffData.phone;
    } else {
      password = 'password123';
    }
  }

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(String(password), salt);

  const staff = await Staff.create({
    ...staffData,
    password: hashedPassword
  });

  await staff.populate([
    { path: 'owner', select: 'name email' },
    { path: 'property', select: 'name address' }
  ]);

  ApiResponse.success(res, staff, 'Staff created successfully', 201);
});

// @desc    Update Staff
// @route   PUT /api/staff/:id
// @access  Private
export const updateStaff = asyncHandler(async (req, res) => {
  const { password, ...updateData } = req.body;

  // If password is being updated, hash it
  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const staff = await Staff.findByIdAndUpdate(req.params.id, updateData, { new: true, runValidators: true })
    .populate('owner property assignedRooms');

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found', 404);
  }

  ApiResponse.success(res, staff, 'Staff updated successfully');
});

// @desc    Delete Staff
// @route   DELETE /api/staff/:id
// @access  Private
export const deleteStaff = asyncHandler(async (req, res) => {
  const staff = await Staff.findByIdAndDelete(req.params.id);

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found', 404);
  }

  ApiResponse.success(res, null, 'Staff deleted successfully');
});

// @desc    Update Staff Permissions
// @route   PATCH /api/staff/:id/permissions
// @access  Private
export const updateStaffPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  const staff = await Staff.findByIdAndUpdate(
    req.params.id,
    { permissions },
    { new: true, runValidators: true }
  );

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found', 404);
  }

  ApiResponse.success(res, staff, 'Staff permissions updated successfully');
});

// @desc    Get Staff by Property
// @route   GET /api/staff/property/:propertyId
// @access  Private
export const getStaffByProperty = asyncHandler(async (req, res) => {
  const staff = await Staff.find({ property: req.params.propertyId })
    .populate('assignedRooms', 'roomNumber')
    .sort({ role: 1, name: 1 });

  ApiResponse.success(res, staff, 'Staff fetched successfully');
});
