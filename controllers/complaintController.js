import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Complaint from '../models/complaintModel.js';

export const getAllComplaints = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, priority, propertyId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (priority) query.priority = priority;
  if (propertyId) query.property = propertyId;

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const skip = (page - 1) * limit;
  const complaints = await Complaint.find(query).populate('tenant property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Complaint.countDocuments(query);
  ApiResponse.paginated(res, complaints, { page: parseInt(page), limit: parseInt(limit), total }, 'Complaints fetched successfully');
});

export const getComplaintById = asyncHandler(async (req, res) => {
  const complaint = await Complaint.findById(req.params.id).populate('tenant property');
  if (!complaint) return ApiResponse.error(res, 'Complaint not found', 404);
  ApiResponse.success(res, complaint, 'Complaint fetched successfully');
});

export const createComplaint = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const complaint = await Complaint.create(req.body);
  await complaint.populate('tenant property');
  ApiResponse.success(res, complaint, 'Complaint created successfully', 201);
});

export const updateComplaint = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const complaint = await Complaint.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!complaint) return ApiResponse.error(res, 'Complaint not found or unauthorized', 404);
  ApiResponse.success(res, complaint, 'Complaint updated successfully');
});

export const deleteComplaint = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const complaint = await Complaint.findOneAndDelete(query);
  if (!complaint) return ApiResponse.error(res, 'Complaint not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Complaint deleted successfully');
});
