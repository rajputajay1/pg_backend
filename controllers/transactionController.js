import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Transaction from '../models/transactionModel.js';
import PgOwner from '../models/pgOwnerModel.js';
import AuditLog from '../models/auditLogModel.js';
import { createOrder, verifyPaymentSignature, getPaymentDetails } from '../utils/razorpayService.js';

// @desc    Get all Transactions
// @route   GET /api/transactions
// @access  Private
export const getAllTransactions = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, type, status, method, ownerId, startDate, endDate } = req.query;

  // Build query
  const query = {};

  if (search) {
    query.$or = [
      { ownerName: { $regex: search, $options: 'i' } },
      { ownerEmail: { $regex: search, $options: 'i' } },
      { propertyName: { $regex: search, $options: 'i' } },
      { transactionId: { $regex: search, $options: 'i' } }
    ];
  }

  if (type) {
    query.type = type;
  }

  if (status) {
    query.status = status;
  }

  if (method) {
    query.method = method;
  }

  if (ownerId) {
    query.owner = ownerId;
  }

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  } else if (ownerId) {
    query.owner = ownerId;
  }

  // Date range filter
  if (startDate || endDate) {
    query.createdAt = {};
    if (startDate) {
      query.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      query.createdAt.$lte = new Date(endDate);
    }
  }

  // Execute query with pagination
  const skip = (page - 1) * limit;
  const transactions = await Transaction.find(query)
    .populate('owner', 'name email phone pgName')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Transaction.countDocuments(query);

  ApiResponse.paginated(res, transactions, {
    page: parseInt(page),
    limit: parseInt(limit),
    total
  }, 'Transactions fetched successfully');
});

// @desc    Get Transaction by ID
// @route   GET /api/transactions/:id
// @access  Private
export const getTransactionById = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findById(req.params.id)
    .populate('owner', 'name email phone pgName');

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  ApiResponse.success(res, transaction, 'Transaction fetched successfully');
});

// @desc    Get Transactions by Owner
// @route   GET /api/transactions/owner/:ownerId
// @access  Private
export const getTransactionsByOwner = asyncHandler(async (req, res) => {
  const transactions = await Transaction.find({ owner: req.params.ownerId })
    .sort({ createdAt: -1 });

  ApiResponse.success(res, transactions, 'Transactions fetched successfully');
});

// @desc    Create Transaction
// @route   POST /api/transactions
// @access  Public (for payment flow)
export const createTransaction = asyncHandler(async (req, res) => {
  const {
    owner,
    ownerName,
    ownerEmail,
    ownerPhone,
    propertyName,
    type,
    amount,
    description,
    method,
    status,
    transactionId,
    razorpayPaymentId,
    planName,
    businessType,
    websiteUrl,
    notes
  } = req.body;

  // Verify owner exists if owner ID is provided
  if (owner) {
    const ownerExists = await PgOwner.findById(owner);
    if (!ownerExists) {
      return ApiResponse.error(res, 'PG Owner not found', 404);
    }
  }

  // Create transaction
  const transaction = await Transaction.create({
    owner,
    ownerName,
    ownerEmail,
    ownerPhone,
    propertyName,
    type: type || 'credit',
    amount,
    description,
    method: method || 'Razorpay',
    status: status || 'pending',
    transactionId,
    razorpayPaymentId,
    planName,
    businessType,
    websiteUrl,
    daysOverdue: 0,
    notes
  });

  // Populate owner details if available
  if (owner) {
    await transaction.populate('owner', 'name email phone pgName');
  }

  // Create audit log
  await AuditLog.create({
    user: ownerEmail || 'System',
    userRole: 'System',
    action: 'CREATE',
    resource: 'Transaction',
    resourceId: transaction._id.toString(),
    description: `Transaction created for ${ownerName} - ${planName} plan - ₹${amount}`,
    category: 'financial',
    severity: 'info',
    metadata: {
      amount,
      planName,
      method,
      status
    }
  });

  ApiResponse.success(res, transaction, 'Transaction created successfully', 201);
});

// @desc    Update Transaction Status
// @route   PATCH /api/transactions/:id/status
// @access  Private
export const updateTransactionStatus = asyncHandler(async (req, res) => {
  const { status } = req.body;

  if (!['pending', 'completed', 'failed', 'overdue'].includes(status)) {
    return ApiResponse.error(res, 'Invalid status value', 400);
  }

  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    { status },
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone pgName');

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  ApiResponse.success(res, transaction, 'Transaction status updated successfully');
});

// @desc    Update Transaction
// @route   PUT /api/transactions/:id
// @access  Private
export const updateTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndUpdate(
    req.params.id,
    req.body,
    { new: true, runValidators: true }
  ).populate('owner', 'name email phone pgName');

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  ApiResponse.success(res, transaction, 'Transaction updated successfully');
});

// @desc    Delete Transaction
// @route   DELETE /api/transactions/:id
// @access  Private (Super Admin)
export const deleteTransaction = asyncHandler(async (req, res) => {
  const transaction = await Transaction.findByIdAndDelete(req.params.id);

  if (!transaction) {
    return ApiResponse.error(res, 'Transaction not found', 404);
  }

  ApiResponse.success(res, null, 'Transaction deleted successfully');
});

// @desc    Get Transaction Statistics
// @route   GET /api/transactions/stats/summary
// @access  Private
export const getTransactionStats = asyncHandler(async (req, res) => {
  const { ownerId, startDate, endDate } = req.query;

  // Build match query
  const matchQuery = {};
  
  if (ownerId) {
    matchQuery.owner = mongoose.Types.ObjectId(ownerId);
  }

  if (startDate || endDate) {
    matchQuery.createdAt = {};
    if (startDate) {
      matchQuery.createdAt.$gte = new Date(startDate);
    }
    if (endDate) {
      matchQuery.createdAt.$lte = new Date(endDate);
    }
  }

  // Total revenue (completed credit transactions)
  const revenueResult = await Transaction.aggregate([
    { $match: { ...matchQuery, status: 'completed', type: 'credit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalRevenue = revenueResult.length > 0 ? revenueResult[0].total : 0;

  // Total expenses (completed debit transactions)
  const expenseResult = await Transaction.aggregate([
    { $match: { ...matchQuery, status: 'completed', type: 'debit' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const totalExpenses = expenseResult.length > 0 ? expenseResult[0].total : 0;

  // Pending amount
  const pendingResult = await Transaction.aggregate([
    { $match: { ...matchQuery, status: 'pending' } },
    { $group: { _id: null, total: { $sum: '$amount' } } }
  ]);

  const pendingAmount = pendingResult.length > 0 ? pendingResult[0].total : 0;

  // Transaction counts by status
  const statusCounts = await Transaction.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$status', count: { $sum: 1 } } }
  ]);

  // Transaction counts by method
  const methodCounts = await Transaction.aggregate([
    { $match: matchQuery },
    { $group: { _id: '$method', count: { $sum: 1 } } }
  ]);

  ApiResponse.success(res, {
    totalRevenue,
    totalExpenses,
    netAmount: totalRevenue - totalExpenses,
    pendingAmount,
    statusCounts,
    methodCounts
  }, 'Transaction statistics fetched successfully');
});

// @desc    Create Razorpay Order
// @route   POST /api/transactions/razorpay/create-order
// @access  Public
export const createRazorpayOrder = asyncHandler(async (req, res) => {
  const { amount, currency = 'INR', notes = {} } = req.body;

  if (!amount || amount <= 0) {
    return ApiResponse.error(res, 'Valid amount is required', 400);
  }

  const result = await createOrder(amount, currency, notes);

  if (!result.success) {
    return ApiResponse.error(res, result.error || 'Failed to create order', 500);
  }

  ApiResponse.success(res, result.order, 'Razorpay order created successfully', 201);
});

// @desc    Verify Razorpay Payment
// @route   POST /api/transactions/razorpay/verify-payment
// @access  Public
export const verifyRazorpayPayment = asyncHandler(async (req, res) => {
  const { razorpay_order_id, razorpay_payment_id, razorpay_signature } = req.body;

  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return ApiResponse.error(res, 'Missing payment verification parameters', 400);
  }

  const isValid = verifyPaymentSignature(razorpay_order_id, razorpay_payment_id, razorpay_signature);

  if (!isValid) {
    // Create audit log for failed payment
    await AuditLog.create({
      user: 'System',
      userRole: 'System',
      action: 'PAYMENT',
      resource: 'Payment Verification',
      resourceId: razorpay_payment_id,
      description: `Payment verification failed for payment ID: ${razorpay_payment_id}`,
      category: 'financial',
      severity: 'warning',
      metadata: {
        razorpay_order_id,
        razorpay_payment_id
      }
    });

    return ApiResponse.error(res, 'Payment verification failed', 400);
  }

  // Fetch payment details from Razorpay
  const paymentResult = await getPaymentDetails(razorpay_payment_id);

  // Create audit log for successful payment
  await AuditLog.create({
    user: 'System',
    userRole: 'System',
    action: 'PAYMENT',
    resource: 'Payment Verification',
    resourceId: razorpay_payment_id,
    description: `Payment verified successfully for payment ID: ${razorpay_payment_id}`,
    category: 'financial',
    severity: 'info',
    metadata: {
      razorpay_order_id,
      razorpay_payment_id,
      amount: paymentResult.success ? paymentResult.payment.amount / 100 : 0
    }
  });

  ApiResponse.success(res, {
    verified: true,
    payment: paymentResult.success ? paymentResult.payment : null
  }, 'Payment verified successfully');
});

