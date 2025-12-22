import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Payment from '../models/paymentModel.js';

export const getAllPayments = asyncHandler(async (req, res) => {
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
  const payments = await Payment.find(query).populate('tenant property').sort({ paymentDate: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Payment.countDocuments(query);
  ApiResponse.paginated(res, payments, { page: parseInt(page), limit: parseInt(limit), total }, 'Payments fetched successfully');
});

export const getPaymentById = asyncHandler(async (req, res) => {
  const payment = await Payment.findById(req.params.id).populate('tenant property');
  if (!payment) return ApiResponse.error(res, 'Payment not found', 404);
  ApiResponse.success(res, payment, 'Payment fetched successfully');
});

export const createPayment = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const payment = await Payment.create(req.body);
  await payment.populate('tenant property');
  ApiResponse.success(res, payment, 'Payment created successfully', 201);
});

export const updatePayment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const payment = await Payment.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!payment) return ApiResponse.error(res, 'Payment not found or unauthorized', 404);
  ApiResponse.success(res, payment, 'Payment updated successfully');
});

export const deletePayment = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const payment = await Payment.findOneAndDelete(query);
  if (!payment) return ApiResponse.error(res, 'Payment not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Payment deleted successfully');
});
