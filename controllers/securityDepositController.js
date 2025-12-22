import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import SecurityDeposit from '../models/securityDepositModel.js';

// @desc    Get All Security Deposits
export const getAllSecurityDeposits = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, tenantId, propertyId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (tenantId) query.tenant = tenantId;
  if (propertyId) query.property = propertyId;

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const skip = (page - 1) * limit;
  const deposits = await SecurityDeposit.find(query).populate('tenant property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await SecurityDeposit.countDocuments(query);
  ApiResponse.paginated(res, deposits, { page: parseInt(page), limit: parseInt(limit), total }, 'Security deposits fetched successfully');
});

// @desc    Get Security Deposit by ID
export const getSecurityDepositById = asyncHandler(async (req, res) => {
  const deposit = await SecurityDeposit.findById(req.params.id).populate('tenant property');
  if (!deposit) return ApiResponse.error(res, 'Security deposit not found', 404);
  ApiResponse.success(res, deposit, 'Security deposit fetched successfully');
});

// @desc    Create
export const createSecurityDeposit = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const deposit = await SecurityDeposit.create(req.body);
  await deposit.populate('tenant property');
  ApiResponse.success(res, deposit, 'Security deposit created successfully', 201);
});

// @desc    Update
export const updateSecurityDeposit = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const deposit = await SecurityDeposit.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!deposit) return ApiResponse.error(res, 'Security deposit not found or unauthorized', 404);
  ApiResponse.success(res, deposit, 'Security deposit updated successfully');
});

// @desc    Delete
export const deleteSecurityDeposit = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const deposit = await SecurityDeposit.findOneAndDelete(query);
  if (!deposit) return ApiResponse.error(res, 'Security deposit not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Security deposit deleted successfully');
});
