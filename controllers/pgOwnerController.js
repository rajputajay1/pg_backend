import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import PgOwner from '../models/pgOwnerModel.js';
import Plan from '../models/planModel.js';
import AuditLog from '../models/auditLogModel.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { generateRandomPassword, sendWelcomeEmail } from '../utils/emailService.js';
import { createOrder, verifyPaymentSignature } from '../utils/razorpayService.js';

// ==================== PG OWNER REGISTRATION ====================

// @desc    Initiate PG Owner Registration (Step 1: Create Razorpay Order)
// @route   POST /api/pg-owners/register/initiate
// @access  Public
export const initiateRegistration = asyncHandler(async (req, res) => {
  const {
    // Personal Details
    name,
    email,
    phone,
    businessType,
    
    // Business Information
    pgName,
    numberOfProperties,
    city,
    state,
    propertyAddress,
    
    // Plan
    planId
  } = req.body;

  // Validation
  if (!name || !email || !phone || !pgName || !planId) {
    return ApiResponse.error(res, 'Please provide all required fields', 400);
  }

  // Email format validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return ApiResponse.error(res, 'Please provide a valid email address', 400);
  }

  // Phone validation (10 digits)
  const phoneRegex = /^[0-9]{10}$/;
  if (!phoneRegex.test(phone)) {
    return ApiResponse.error(res, 'Please provide a valid 10-digit phone number', 400);
  }

  // Check if email already exists
  const existingOwner = await PgOwner.findOne({ email: email.toLowerCase() });
  if (existingOwner) {
    return ApiResponse.error(res, 'Email already registered. Please use a different email or login.', 400);
  }

  // Fetch plan details
  const plan = await Plan.findById(planId);
  if (!plan) {
    return ApiResponse.error(res, 'Invalid plan selected', 400);
  }

  if (!plan.isActive) {
    return ApiResponse.error(res, 'Selected plan is not available at the moment', 400);
  }

  // Create Razorpay order
  const orderResult = await createOrder(
    plan.price,
    'INR',
    {
      name,
      email,
      phone,
      pgName,
      planId: plan._id.toString(),
      planName: plan.name
    }
  );

  if (!orderResult.success) {
    console.error('Razorpay order creation failed:', orderResult.error);
    return ApiResponse.error(res, 'Failed to create payment order. Please try again.', 500);
  }

  // Return order details and registration data for frontend
  ApiResponse.success(res, {
    orderId: orderResult.order.id,
    amount: orderResult.order.amount,
    currency: orderResult.order.currency,
    razorpayKeyId: process.env.RAZORPAY_KEY_ID,
    planDetails: {
      id: plan._id,
      name: plan.name,
      price: plan.price,
      period: plan.period,
      description: plan.description,
      features: plan.features
    },
    registrationData: {
      name,
      email,
      phone,
      businessType,
      pgName,
      numberOfProperties,
      city,
      state,
      propertyAddress
    }
  }, 'Payment order created successfully. Proceed with payment.');
});

// @desc    Complete PG Owner Registration (Step 2: Verify Payment & Create Owner)
// @route   POST /api/pg-owners/register/complete
// @access  Public
export const completeRegistration = asyncHandler(async (req, res) => {
  const {
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature,
    registrationData
  } = req.body;

  // Validation
  if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
    return ApiResponse.error(res, 'Missing payment verification data', 400);
  }

  if (!registrationData) {
    return ApiResponse.error(res, 'Missing registration data', 400);
  }

  const {
    name,
    email,
    phone,
    businessType,
    pgName,
    numberOfProperties,
    city,
    state,
    propertyAddress,
    planId
  } = registrationData;

  // Validate required fields
  if (!name || !email || !phone || !planId) {
    return ApiResponse.error(res, 'Incomplete registration data', 400);
  }

  // Verify Razorpay payment signature
  const isValidSignature = verifyPaymentSignature(
    razorpay_order_id,
    razorpay_payment_id,
    razorpay_signature
  );

  if (!isValidSignature) {
    console.error('Payment signature verification failed');
    return ApiResponse.error(res, 'Payment verification failed. Invalid signature.', 400);
  }

  // Check if email already exists (double-check)
  const existingOwner = await PgOwner.findOne({ email: email.toLowerCase() });
  if (existingOwner) {
    return ApiResponse.error(res, 'Email already registered', 400);
  }

  // Fetch plan details
  const plan = await Plan.findById(planId);
  if (!plan) {
    return ApiResponse.error(res, 'Invalid plan', 400);
  }

  // Generate random password
  const generatedPassword = generateRandomPassword(12);

  // Hash password
  const salt = await bcrypt.genSalt(10);
  const hashedPassword = await bcrypt.hash(generatedPassword, salt);

  // Calculate plan dates
  const planStartDate = new Date();
  const planEndDate = new Date(planStartDate);

  if (plan.period === 'month') {
    planEndDate.setMonth(planEndDate.getMonth() + 1);
  } else if (plan.period === 'year') {
    planEndDate.setFullYear(planEndDate.getFullYear() + 1);
  } else if (plan.period === 'lifetime') {
    planEndDate.setFullYear(planEndDate.getFullYear() + 100);
  }

  // Generate website URL
  const websiteUrl = process.env.OWNER_FRONTEND_URL || 'http://localhost:8081';

  // Create PG Owner
  const owner = await PgOwner.create({
    name,
    email: email.toLowerCase(),
    phone,
    password: hashedPassword,
    pgName,
    pgAddress: propertyAddress,
    noOfPgs: numberOfProperties || 1,
    city,
    state,
    businessType: businessType || 'PG',
    planId: plan._id,
    planName: plan.name,
    planPrice: plan.price,
    planPeriod: plan.period,
    websiteUrl,
    paymentStatus: 'completed',
    transactionId: razorpay_order_id,
    razorpayPaymentId: razorpay_payment_id,
    paymentDate: new Date(),
    planStartDate,
    planEndDate,
    isActive: true
  });

  // Send welcome email with credentials
  let emailSent = false;
  console.log('📧 Attempting to send welcome email...');
  console.log('📧 Email data:', { to: email, name, planName: plan.name, planPrice: plan.price });
  
  try {
    const emailResult = await sendWelcomeEmail({
      to: email,
      name,
      email,
      password: generatedPassword,
      websiteUrl,
      planName: plan.name,
      planPrice: plan.price
    });
    emailSent = emailResult.success;
    
    console.log('📧 Email result:', emailResult);
    
    if (emailSent) {
      console.log(`✅ Welcome email sent to ${email}`);
    } else {
      console.error(`❌ Failed to send welcome email to ${email}:`, emailResult.message);
    }
  } catch (emailError) {
    console.error('❌ Email sending error (caught exception):', emailError);
  }

  // Create audit log
  await AuditLog.create({
    user: owner.name,
    userRole: 'PG Owner',
    action: 'CREATE',
    resource: 'PgOwner',
    resourceId: owner._id.toString(),
    description: `PG Owner registered: ${owner.name} (${owner.email})`,
    category: 'registration',
    severity: 'info',
    metadata: {
      email: owner.email,
      planName: plan.name,
      planPrice: plan.price,
      planPeriod: plan.period,
      paymentStatus: 'completed',
      razorpayPaymentId: razorpay_payment_id,
      razorpayOrderId: razorpay_order_id,
      emailSent
    }
  });

  // Remove password from response
  const ownerData = owner.toObject();
  delete ownerData.password;

  ApiResponse.success(res, {
    owner: {
      ...ownerData,
      password: generatedPassword, // Send plain password for display (one-time only)
      websiteUrl: websiteUrl
    },
    emailSent,
    message: emailSent 
      ? 'Registration successful! Login credentials have been sent to your email.'
      : 'Registration successful! Please contact support for login credentials.'
  }, 'PG Owner registered successfully', 201);
});

// @desc    Check if email already exists
// @route   POST /api/pg-owners/check-email
// @access  Public
export const checkEmailAvailability = asyncHandler(async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return ApiResponse.error(res, 'Email is required', 400);
  }

  // Email format validation
  const emailRegex = /^\S+@\S+\.\S+$/;
  if (!emailRegex.test(email)) {
    return ApiResponse.error(res, 'Invalid email format', 400);
  }

  const owner = await PgOwner.findOne({ email: email.toLowerCase() });

  ApiResponse.success(res, {
    available: !owner,
    message: owner ? 'Email already registered' : 'Email is available'
  }, 'Email availability checked');
});

// @desc    PG Owner Login
// @route   POST /api/pg-owners/login
// @access  Public
export const login = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  // Validation
  if (!email || !password) {
    return ApiResponse.error(res, 'Please provide email and password', 400);
  }

  // Find user with password field and populate plan
  const owner = await PgOwner.findOne({ email: email.toLowerCase() })
    .select('+password')
    .populate('planId');

  if (!owner) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  // Check if account is active
  if (!owner.isActive) {
    return ApiResponse.error(res, 'Your account is inactive. Please contact admin.', 403);
  }

  // Check password
  const isPasswordValid = await bcrypt.compare(password, owner.password);

  if (!isPasswordValid) {
    return ApiResponse.error(res, 'Invalid credentials', 401);
  }

  // Get allowed modules from plan
  const allowedModules = owner.planId?.allowedModules || [];

  // Generate token with plan modules
  const token = jwt.sign(
    { 
      id: owner._id, 
      email: owner.email, 
      role: 'pg_owner',
      planId: owner.planId?._id,
      allowedModules
    },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRE || '7d' }
  );

  // Remove password from response
  const ownerData = owner.toObject();
  delete ownerData.password;

  ApiResponse.success(res, {
    token,
    user: {
      id: ownerData._id,
      email: ownerData.email,
      role: 'pg_owner',
      name: ownerData.name,
      ...ownerData,
      allowedModules // Include allowed modules in response
    }
  }, 'Login successful');
});

// ==================== SUPER ADMIN - PG OWNER MANAGEMENT ====================

// @desc    Get all PG Owners
// @route   GET /api/pg-owners
// @access  Private (Super Admin)
export const getAllPgOwners = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, planName, city, state } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } },
      { pgName: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.paymentStatus = status;
  if (planName) query.planName = planName;
  if (city) query.city = { $regex: city, $options: 'i' };
  if (state) query.state = { $regex: state, $options: 'i' };

  const skip = (page - 1) * limit;
  const owners = await PgOwner.find(query)
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await PgOwner.countDocuments(query);

  ApiResponse.paginated(res, owners, {
    page: parseInt(page),
    limit: parseInt(limit),
    total
  }, 'PG Owners fetched successfully');
});

// @desc    Get PG Owner by ID
// @route   GET /api/pg-owners/:id
// @access  Private (Super Admin)
export const getPgOwnerById = asyncHandler(async (req, res) => {
  const owner = await PgOwner.findById(req.params.id);

  if (!owner) {
    return ApiResponse.error(res, 'PG Owner not found', 404);
  }

  ApiResponse.success(res, owner, 'PG Owner fetched successfully');
});

// @desc    Update PG Owner
// @route   PUT /api/pg-owners/:id
// @access  Private (Super Admin)
export const updatePgOwner = asyncHandler(async (req, res) => {
  const { password, email, ...updateData } = req.body;

  if (email) {
    const existingOwner = await PgOwner.findOne({
      email: email.toLowerCase(),
      _id: { $ne: req.params.id }
    });

    if (existingOwner) {
      return ApiResponse.error(res, 'Email already in use', 400);
    }
    updateData.email = email.toLowerCase();
  }

  if (password) {
    const salt = await bcrypt.genSalt(10);
    updateData.password = await bcrypt.hash(password, salt);
  }

  const owner = await PgOwner.findByIdAndUpdate(
    req.params.id,
    updateData,
    { new: true, runValidators: true }
  );

  if (!owner) {
    return ApiResponse.error(res, 'PG Owner not found', 404);
  }

  ApiResponse.success(res, owner, 'PG Owner updated successfully');
});

// @desc    Delete PG Owner
// @route   DELETE /api/pg-owners/:id
// @access  Private (Super Admin)
export const deletePgOwner = asyncHandler(async (req, res) => {
  const owner = await PgOwner.findByIdAndDelete(req.params.id);

  if (!owner) {
    return ApiResponse.error(res, 'PG Owner not found', 404);
  }

  ApiResponse.success(res, null, 'PG Owner deleted successfully');
});

// @desc    Toggle PG Owner Status
// @route   PATCH /api/pg-owners/:id/status
// @access  Private (Super Admin)
export const toggleOwnerStatus = asyncHandler(async (req, res) => {
  const { isActive } = req.body;

  const owner = await PgOwner.findByIdAndUpdate(
    req.params.id,
    { isActive },
    { new: true, runValidators: true }
  );

  if (!owner) {
    return ApiResponse.error(res, 'PG Owner not found', 404);
  }

  ApiResponse.success(res, owner, `PG Owner ${isActive ? 'activated' : 'deactivated'} successfully`);
});

// @desc    Get Dashboard Statistics
// @route   GET /api/pg-owners/stats/dashboard
// @access  Private (Super Admin)
export const getDashboardStats = asyncHandler(async (req, res) => {
  // 1. Basic Counts
  const totalOwners = await PgOwner.countDocuments();
  const activeOwners = await PgOwner.countDocuments({ isActive: true });
  
  // 2. Active Properties (Aggregation)
  const propertiesResult = await PgOwner.aggregate([
    {
      $group: {
        _id: null,
        totalConfiguredResults: { $sum: "$noOfPgs" }
      }
    }
  ]);
  const totalProperties = propertiesResult.length > 0 ? propertiesResult[0].totalConfiguredResults : 0;

  // 3. Financial Stats (Pending Payments)
  const pendingPaymentsResult = await PgOwner.aggregate([
    { $match: { paymentStatus: 'pending' } },
    {
      $group: {
        _id: null,
        totalPendingAmount: { $sum: "$planPrice" } 
      }
    }
  ]);
  const pendingAmount = pendingPaymentsResult.length > 0 ? pendingPaymentsResult[0].totalPendingAmount : 0;

  // 4. Revenue Over Time (Last 6 months)
  const sixMonthsAgo = new Date();
  sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);
  
  const revenueDataRaw = await PgOwner.aggregate([
    { 
      $match: { 
        paymentStatus: 'completed',
        paymentDate: { $gte: sixMonthsAgo } 
      } 
    },
    {
      $group: {
        _id: { 
          month: { $month: "$paymentDate" }, 
          year: { $year: "$paymentDate" } 
        },
        revenue: { $sum: "$planPrice" }
      }
    },
    { $sort: { "_id.year": 1, "_id.month": 1 } }
  ]);
  
  // Format revenue data for recharts
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const revenueData = revenueDataRaw.map(item => ({
    name: `${months[item._id.month - 1]} ${item._id.year}`,
    revenue: item.revenue,
    expenses: Math.round(item.revenue * 0.3) // Simulated expenses
  }));

  // 5. Recent Registrations
  const recentRegistrations = await PgOwner.find()
    .select('name email createdAt isActive paymentStatus planName')
    .sort({ createdAt: -1 })
    .limit(5);

  // 6. Pending Payments List
  const pendingPaymentsList = await PgOwner.find({ paymentStatus: 'pending' })
    .select('name planPrice createdAt planName')
    .sort({ createdAt: 1 })
    .limit(5);

  // 7. Plan Distribution
  const planDistributionRaw = await PgOwner.aggregate([
    {
      $group: {
        _id: "$planName",
        value: { $sum: 1 }
      }
    }
  ]);
  
  const occupancyData = planDistributionRaw.map(item => ({
    name: item._id || 'Unknown',
    value: item.value
  }));

  // 8. Owner Performance (Top 5 by Revenue - simulated by plan price for now)
  const ownerPerformanceData = await PgOwner.find({ paymentStatus: 'completed' })
    .sort({ planPrice: -1 })
    .limit(5)
    .select('name planPrice')
    .then(owners => owners.map(o => ({ name: o.name, value: o.planPrice })));

  const stats = {
    totalOwners,
    totalProperties,
    activeOwners,
    occupancyRate: totalOwners > 0 ? Math.round((activeOwners / totalOwners) * 1000) / 10 : 0,
    pendingAmount,
    revenueData,
    recentRegistrations,
    pendingPaymentsList,
    occupancyData,
    ownerPerformanceData
  };

  ApiResponse.success(res, stats, 'Dashboard statistics fetched successfully');
});
