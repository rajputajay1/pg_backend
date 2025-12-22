import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Staff from '../models/staffModel.js';
import Property from '../models/propertyModel.js';
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
  
  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    query.owner = ownerId;
  }
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

  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    staffData.owner = req.user._id;
  }

  // Security: Confirm property belongs to owner
  if (staffData.property) {
      if (req.user && req.user.role === 'pg_owner') {
          // DEBUGGING BLOCK
          console.log('--- Debugging Staff Creation ---');
          const targetProperty = await Property.findById(staffData.property);
          
          if (!targetProperty) {
              return ApiResponse.error(res, `Property with ID ${staffData.property} not found in database`, 404);
          }

          console.log('Target Property:', targetProperty); // Print the whole object to see fields

          if (!targetProperty.owner) {
              console.error(`CRITICAL: Property ${staffData.property} has NO OWNER field! Data corruption?`);
              return ApiResponse.error(res, `System Error: Property ${staffData.property} exists but has no owner assigned. Please contact support.`, 500);
          }
          
          console.log('User ID from Request:', req.user._id);
          console.log('User Object:', req.user);

          const propertyOwnerId = String(targetProperty.owner);
          const currentUserId = String(req.user._id);

          if (propertyOwnerId !== currentUserId) {
              return ApiResponse.error(res, `Ownership Mismatch! Property belongs to: ${propertyOwnerId}, but you are: ${currentUserId}`, 403);
          }
          // END DEBUGGING BLOCK
      }
  }

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

  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const staff = await Staff.findOneAndUpdate(query, updateData, { new: true, runValidators: true })
    .populate('owner property assignedRooms');

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found or unauthorized', 404);
  }

  ApiResponse.success(res, staff, 'Staff updated successfully');
});

// @desc    Delete Staff
// @route   DELETE /api/staff/:id
// @access  Private
export const deleteStaff = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const staff = await Staff.findOneAndDelete(query);

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found or unauthorized', 404);
  }

  ApiResponse.success(res, null, 'Staff deleted successfully');
});

// @desc    Update Staff Permissions
// @route   PATCH /api/staff/:id/permissions
// @access  Private
export const updateStaffPermissions = asyncHandler(async (req, res) => {
  const { permissions } = req.body;

  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const staff = await Staff.findOneAndUpdate(
    query,
    { permissions },
    { new: true, runValidators: true }
  );

  if (!staff) {
    return ApiResponse.error(res, 'Staff not found or unauthorized', 404);
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
