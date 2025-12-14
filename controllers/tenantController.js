import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Tenant from '../models/tenantModel.js';
import Room from '../models/roomModel.js';
import Property from '../models/propertyModel.js';
import PgOwner from '../models/pgOwnerModel.js';

// @desc    Get all Tenants
// @route   GET /api/tenants
// @access  Private
export const getAllTenants = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, search, status, paymentStatus, propertyId, ownerId, occupation } = req.query;

  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: 'i' } },
      { email: { $regex: search, $options: 'i' } },
      { phone: { $regex: search, $options: 'i' } }
    ];
  }

  if (status) query.status = status;
  if (paymentStatus) query.paymentStatus = paymentStatus;
  if (propertyId) query.property = propertyId;
  if (ownerId) query.owner = ownerId;
  if (occupation) query.occupation = occupation;

  const skip = (page - 1) * limit;
  const tenants = await Tenant.find(query)
    .populate('property', 'name address city')
    .populate('owner', 'name email')
    .populate('room', 'roomNumber roomType')
    .populate('mealPlan', 'name price')
    .sort({ createdAt: -1 })
    .limit(parseInt(limit))
    .skip(skip);

  const total = await Tenant.countDocuments(query);

  ApiResponse.paginated(res, tenants, { page: parseInt(page), limit: parseInt(limit), total }, 'Tenants fetched successfully');
});

// @desc    Get Tenant by ID
// @route   GET /api/tenants/:id
// @access  Private
export const getTenantById = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id)
    .populate('property', 'name address city')
    .populate('owner', 'name email phone')
    .populate('room', 'roomNumber roomType rent')
    .populate('mealPlan', 'name price');

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Tenant fetched successfully');
});

// @desc    Create Tenant
// @route   POST /api/tenants
// @access  Private
export const createTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.create(req.body);
  
  await tenant.populate([
    { path: 'property', select: 'name address' },
    { path: 'owner', select: 'name email' },
    { path: 'room', select: 'roomNumber roomType' }
  ]);

  // Update room occupancy
  if (req.body.room) {
    await Room.findByIdAndUpdate(req.body.room, { $inc: { currentOccupancy: 1 } });
  }

  ApiResponse.success(res, tenant, 'Tenant created successfully', 201);
});

// @desc    Update Tenant
// @route   PUT /api/tenants/:id
// @access  Private
export const updateTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true })
    .populate('property owner room mealPlan');

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Tenant updated successfully');
});

// @desc    Delete Tenant
// @route   DELETE /api/tenants/:id
// @access  Private
export const deleteTenant = asyncHandler(async (req, res) => {
  const tenant = await Tenant.findById(req.params.id);

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  // Update room occupancy
  if (tenant.room) {
    await Room.findByIdAndUpdate(tenant.room, { $inc: { currentOccupancy: -1 } });
  }

  await tenant.deleteOne();

  ApiResponse.success(res, null, 'Tenant deleted successfully');
});

// @desc    Update Payment Status
// @route   PATCH /api/tenants/:id/payment-status
// @access  Private
export const updatePaymentStatus = asyncHandler(async (req, res) => {
  const { paymentStatus, lastPaymentDate, nextPaymentDue } = req.body;

  const tenant = await Tenant.findByIdAndUpdate(
    req.params.id,
    { paymentStatus, lastPaymentDate, nextPaymentDue },
    { new: true, runValidators: true }
  );

  if (!tenant) {
    return ApiResponse.error(res, 'Tenant not found', 404);
  }

  ApiResponse.success(res, tenant, 'Payment status updated successfully');
});

// @desc    Get Tenants by Property
// @route   GET /api/tenants/property/:propertyId
// @access  Private
export const getTenantsByProperty = asyncHandler(async (req, res) => {
  const tenants = await Tenant.find({ property: req.params.propertyId })
    .populate('room', 'roomNumber roomType')
    .sort({ createdAt: -1 });

  ApiResponse.success(res, tenants, 'Tenants fetched successfully');
});
