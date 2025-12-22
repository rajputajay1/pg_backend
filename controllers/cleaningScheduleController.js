import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import CleaningSchedule from '../models/cleaningScheduleModel.js';

export const getAllCleaningSchedules = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, propertyId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (propertyId) query.property = propertyId;

  // Security: Enforce ownership for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }

  const skip = (page - 1) * limit;
  const schedules = await CleaningSchedule.find(query).populate('property room assignedTo').sort({ scheduledDate: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await CleaningSchedule.countDocuments(query);
  ApiResponse.paginated(res, schedules, { page: parseInt(page), limit: parseInt(limit), total }, 'Cleaning schedules fetched successfully');
});

export const getCleaningScheduleById = asyncHandler(async (req, res) => {
  const schedule = await CleaningSchedule.findById(req.params.id).populate('property room assignedTo');
  if (!schedule) return ApiResponse.error(res, 'Cleaning schedule not found', 404);
  ApiResponse.success(res, schedule, 'Cleaning schedule fetched successfully');
});

export const createCleaningSchedule = asyncHandler(async (req, res) => {
  // Security: Force owner ID for PG Owners
  if (req.user && req.user.role === 'pg_owner') {
    req.body.owner = req.user._id;
  }
  const schedule = await CleaningSchedule.create(req.body);
  await schedule.populate('property room assignedTo');
  ApiResponse.success(res, schedule, 'Cleaning schedule created successfully', 201);
});

export const updateCleaningSchedule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const schedule = await CleaningSchedule.findOneAndUpdate(query, req.body, { new: true, runValidators: true });
  if (!schedule) return ApiResponse.error(res, 'Cleaning schedule not found or unauthorized', 404);
  ApiResponse.success(res, schedule, 'Cleaning schedule updated successfully');
});

export const deleteCleaningSchedule = asyncHandler(async (req, res) => {
  const query = { _id: req.params.id };
  // Security: Enforce ownership
  if (req.user && req.user.role === 'pg_owner') {
    query.owner = req.user._id;
  }
  const schedule = await CleaningSchedule.findOneAndDelete(query);
  if (!schedule) return ApiResponse.error(res, 'Cleaning schedule not found or unauthorized', 404);
  ApiResponse.success(res, null, 'Cleaning schedule deleted successfully');
});
