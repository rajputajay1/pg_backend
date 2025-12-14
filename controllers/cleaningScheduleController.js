import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import CleaningSchedule from '../models/cleaningScheduleModel.js';

export const getAllCleaningSchedules = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, status, propertyId } = req.query;
  const query = {};
  if (status) query.status = status;
  if (propertyId) query.property = propertyId;

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
  const schedule = await CleaningSchedule.create(req.body);
  await schedule.populate('property room assignedTo');
  ApiResponse.success(res, schedule, 'Cleaning schedule created successfully', 201);
});

export const updateCleaningSchedule = asyncHandler(async (req, res) => {
  const schedule = await CleaningSchedule.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!schedule) return ApiResponse.error(res, 'Cleaning schedule not found', 404);
  ApiResponse.success(res, schedule, 'Cleaning schedule updated successfully');
});

export const deleteCleaningSchedule = asyncHandler(async (req, res) => {
  const schedule = await CleaningSchedule.findByIdAndDelete(req.params.id);
  if (!schedule) return ApiResponse.error(res, 'Cleaning schedule not found', 404);
  ApiResponse.success(res, null, 'Cleaning schedule deleted successfully');
});
