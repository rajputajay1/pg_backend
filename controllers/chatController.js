import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Chat from '../models/chatModel.js';

export const getAllChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, propertyId } = req.query;
  const query = {};
  if (userId) query.$or = [{ sender: userId }, { receiver: userId }];
  if (propertyId) query.property = propertyId;

  const skip = (page - 1) * limit;
  const chats = await Chat.find(query).populate('sender receiver property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Chat.countDocuments(query);
  ApiResponse.paginated(res, chats, { page: parseInt(page), limit: parseInt(limit), total }, 'Chats fetched successfully');
});

export const getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id).populate('sender receiver property');
  if (!chat) return ApiResponse.error(res, 'Chat not found', 404);
  ApiResponse.success(res, chat, 'Chat fetched successfully');
});

export const createChat = asyncHandler(async (req, res) => {
  const chat = await Chat.create(req.body);
  await chat.populate('sender receiver property');
  ApiResponse.success(res, chat, 'Chat created successfully', 201);
});

export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findByIdAndDelete(req.params.id);
  if (!chat) return ApiResponse.error(res, 'Chat not found', 404);
  ApiResponse.success(res, null, 'Chat deleted successfully');
});
