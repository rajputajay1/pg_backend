import asyncHandler from '../utils/asyncHandler.js';
import ApiResponse from '../utils/ApiResponse.js';
import Chat from '../models/chatModel.js';

// @desc    Get All Chats (Secured)
export const getAllChats = asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, userId, propertyId } = req.query;
  const query = {};
  
  if (propertyId) query.property = propertyId;

  // Security: Enforce ownership/participation
  if (req.user && req.user.role === 'pg_owner') {
    // Show chats where owner is sender OR receiver
    // AND optional property filter
    query.$or = [{ sender: req.user._id }, { receiver: req.user._id }];
  } else if (userId) {
     // Admin can filter by userId
     query.$or = [{ sender: userId }, { receiver: userId }];
  }

  const skip = (page - 1) * limit;
  const chats = await Chat.find(query).populate('sender receiver property').sort({ createdAt: -1 }).limit(parseInt(limit)).skip(skip);
  const total = await Chat.countDocuments(query);
  ApiResponse.paginated(res, chats, { page: parseInt(page), limit: parseInt(limit), total }, 'Chats fetched successfully');
});

export const getChatById = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id).populate('sender receiver property');
  if (!chat) return ApiResponse.error(res, 'Chat not found', 404);
  
  // Security: Check participation
  if (req.user && req.user.role === 'pg_owner') {
     const isParticipant = chat.sender._id.toString() === req.user._id.toString() || 
                           chat.receiver._id.toString() === req.user._id.toString();
     if (!isParticipant) {
         return ApiResponse.error(res, 'Unauthorized to view this chat', 403);
     }
  }

  ApiResponse.success(res, chat, 'Chat fetched successfully');
});

export const createChat = asyncHandler(async (req, res) => {
  const chat = await Chat.create(req.body);
  await chat.populate('sender receiver property');
  ApiResponse.success(res, chat, 'Chat created successfully', 201);
});

export const deleteChat = asyncHandler(async (req, res) => {
  const chat = await Chat.findById(req.params.id);
  if (!chat) return ApiResponse.error(res, 'Chat not found', 404);

  // Security: Only participants can delete (or admin)
  if (req.user && req.user.role === 'pg_owner') {
     const isParticipant = chat.sender.toString() === req.user._id.toString() || 
                           chat.receiver.toString() === req.user._id.toString();
     if (!isParticipant) {
         return ApiResponse.error(res, 'Unauthorized to delete this chat', 403);
     }
  }

  await chat.deleteOne();
  ApiResponse.success(res, null, 'Chat deleted successfully');
});
