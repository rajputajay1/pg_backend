import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Plan from '../models/planModel.js';
import AuditLog from '../models/auditLogModel.js';
import { validateModules } from '../utils/moduleConfig.js';

// @desc    Get all active plans (Public)
// @route   GET /api/plans
// @access  Public
export const getActivePlans = asyncHandler(async (req, res) => {
  const plans = await Plan.find({ isActive: true }).sort({ displayOrder: 1, createdAt: -1 });
  
  ApiResponse.success(res, plans, 'Active plans fetched successfully');
});

// @desc    Get all plans (Admin)
// @route   GET /api/plans/all
// @access  Private/Admin
export const getAllPlans = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search = '', isActive } = req.query;

  const query = {};
  
  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { description: { $regex: search, $options: 'i' } },
    ];
  }
  
  if (isActive !== undefined) {
    query.isActive = isActive === 'true';
  }

  const skip = (parseInt(page) - 1) * parseInt(limit);

  const [plans, total] = await Promise.all([
    Plan.find(query)
      .sort({ displayOrder: 1, createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip),
    Plan.countDocuments(query),
  ]);

  ApiResponse.success(res, {
    plans,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / parseInt(limit)),
    },
  }, 'Plans fetched successfully');
});

// @desc    Get plan by ID
// @route   GET /api/plans/:id
// @access  Public
export const getPlanById = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return ApiResponse.error(res, 'Plan not found', 404);
  }

  ApiResponse.success(res, plan, 'Plan fetched successfully');
});

// @desc    Create new plan
// @route   POST /api/plans
// @access  Private/Admin
export const createPlan = asyncHandler(async (req, res) => {
  const { name, price, period, description, features, allowedModules, displayOrder } = req.body;

  // Validation
  if (!name || !price || !period || !description || !features || !allowedModules) {
    return ApiResponse.error(res, 'Please provide all required fields', 400);
  }

  if (!Array.isArray(features) || features.length === 0) {
    return ApiResponse.error(res, 'At least one feature is required', 400);
  }

  // Validate allowed modules
  const moduleValidation = validateModules(allowedModules);
  if (!moduleValidation.valid) {
    return ApiResponse.error(res, moduleValidation.error, 400);
  }

  // Check if plan name already exists
  const existingPlan = await Plan.findOne({ name });
  if (existingPlan) {
    return ApiResponse.error(res, 'Plan with this name already exists', 400);
  }

  // Create plan
  const plan = await Plan.create({
    name,
    price,
    period,
    description,
    features,
    allowedModules,
    displayOrder: displayOrder || 0,
  });

  // Create audit log
  await AuditLog.create({
    user: req.user?.email || 'Super Admin',
    userRole: 'Super Admin',
    action: 'CREATE',
    resource: 'Plan',
    resourceId: plan._id.toString(),
    description: `Created plan: ${plan.name}`,
    category: 'plan_management',
    severity: 'info',
    metadata: {
      planName: plan.name,
      price: plan.price,
      allowedModules: plan.allowedModules,
    },
  });

  ApiResponse.success(res, plan, 'Plan created successfully', 201);
});

// @desc    Update plan
// @route   PUT /api/plans/:id
// @access  Private/Admin
export const updatePlan = asyncHandler(async (req, res) => {
  const { name, price, period, description, features, allowedModules, isActive, displayOrder } = req.body;

  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return ApiResponse.error(res, 'Plan not found', 404);
  }

  // Check if new name conflicts with existing plan
  if (name && name !== plan.name) {
    const existingPlan = await Plan.findOne({ name, _id: { $ne: req.params.id } });
    if (existingPlan) {
      return ApiResponse.error(res, 'Plan with this name already exists', 400);
    }
  }

  // Validate allowed modules if provided
  if (allowedModules) {
    const moduleValidation = validateModules(allowedModules);
    if (!moduleValidation.valid) {
      return ApiResponse.error(res, moduleValidation.error, 400);
    }
  }

  // Update fields
  if (name) plan.name = name;
  if (price !== undefined) plan.price = price;
  if (period) plan.period = period;
  if (description) plan.description = description;
  if (features) plan.features = features;
  if (allowedModules) plan.allowedModules = allowedModules;
  if (isActive !== undefined) plan.isActive = isActive;
  if (displayOrder !== undefined) plan.displayOrder = displayOrder;

  await plan.save();

  // Create audit log
  await AuditLog.create({
    user: req.user?.email || 'Super Admin',
    userRole: 'Super Admin',
    action: 'UPDATE',
    resource: 'Plan',
    resourceId: plan._id.toString(),
    description: `Updated plan: ${plan.name}`,
    category: 'plan_management',
    severity: 'info',
    metadata: {
      planName: plan.name,
      price: plan.price,
      allowedModules: plan.allowedModules,
    },
  });

  ApiResponse.success(res, plan, 'Plan updated successfully');
});

// @desc    Delete plan
// @route   DELETE /api/plans/:id
// @access  Private/Admin
export const deletePlan = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return ApiResponse.error(res, 'Plan not found', 404);
  }

  // Create audit log before deletion
  await AuditLog.create({
    user: req.user?.email || 'Super Admin',
    userRole: 'Super Admin',
    action: 'DELETE',
    resource: 'Plan',
    resourceId: plan._id.toString(),
    description: `Deleted plan: ${plan.name}`,
    category: 'plan_management',
    severity: 'warning',
    metadata: {
      planName: plan.name,
      price: plan.price,
    },
  });

  await plan.deleteOne();

  ApiResponse.success(res, null, 'Plan deleted successfully');
});

// @desc    Toggle plan active status
// @route   PATCH /api/plans/:id/toggle
// @access  Private/Admin
export const togglePlanStatus = asyncHandler(async (req, res) => {
  const plan = await Plan.findById(req.params.id);

  if (!plan) {
    return ApiResponse.error(res, 'Plan not found', 404);
  }

  plan.isActive = !plan.isActive;
  await plan.save();

  // Create audit log
  await AuditLog.create({
    user: req.user?.email || 'Super Admin',
    userRole: 'Super Admin',
    action: 'UPDATE',
    resource: 'Plan',
    resourceId: plan._id.toString(),
    description: `${plan.isActive ? 'Activated' : 'Deactivated'} plan: ${plan.name}`,
    category: 'plan_management',
    severity: 'info',
    metadata: {
      planName: plan.name,
      isActive: plan.isActive,
    },
  });

  ApiResponse.success(res, plan, `Plan ${plan.isActive ? 'activated' : 'deactivated'} successfully`);
});
