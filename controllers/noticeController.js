import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Notice from '../models/noticeModel.js';

export const getAllNotices = asyncHandler(async (req, res) => {
  const { page = 1, limit = 10, isActive, propertyId } = req.query;
  const query = {};
  if (isActive !== undefined) query.isActive = isActive === 'true';
  if (propertyId) query.property = propertyId;

  const skip = (page - 1) * limit;
  const notices = await Notice.find(query).populate('property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Notice.countDocuments(query);
  ApiResponse.paginated(res, notices, { page: parseInt(page), limit: parseInt(limit), total }, 'Notices fetched successfully');
});

export const getNoticeById = asyncHandler(async (req, res) => {
  const notice = await Notice.findById(req.params.id).populate('property');
  if (!notice) return ApiResponse.error(res, 'Notice not found', 404);
  ApiResponse.success(res, notice, 'Notice fetched successfully');
});

export const createNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.create(req.body);
  await notice.populate('property');
  ApiResponse.success(res, notice, 'Notice created successfully', 201);
});

export const updateNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndUpdate(req.params.id, req.body, { new: true, runValidators: true });
  if (!notice) return ApiResponse.error(res, 'Notice not found', 404);
  ApiResponse.success(res, notice, 'Notice updated successfully');
});

export const deleteNotice = asyncHandler(async (req, res) => {
  const notice = await Notice.findByIdAndDelete(req.params.id);
  if (!notice) return ApiResponse.error(res, 'Notice not found', 404);
  ApiResponse.success(res, null, 'Notice deleted successfully');
});
