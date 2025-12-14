import mongoose from 'mongoose';

const chatSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    chatType: {
      type: String,
      enum: ['Individual', 'Group', 'Support'],
      default: 'Individual'
    },
    participants: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'participants.userType',
        required: true
      },
      userType: {
        type: String,
        enum: ['User', 'Tenant', 'Staff'],
        required: true
      },
      name: String,
      joinedAt: {
        type: Date,
        default: Date.now
      }
    }],
    groupName: {
      type: String,
      trim: true
    },
    groupIcon: {
      type: String,
      trim: true
    },
    messages: [{
      sender: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'messages.senderType',
        required: true
      },
      senderType: {
        type: String,
        enum: ['User', 'Tenant', 'Staff'],
        required: true
      },
      senderName: String,
      message: {
        type: String,
        required: true,
        trim: true,
        maxlength: [2000, 'Message cannot exceed 2000 characters']
      },
      messageType: {
        type: String,
        enum: ['text', 'image', 'file', 'voice'],
        default: 'text'
      },
      attachments: [{
        name: String,
        url: String,
        type: String,
        size: Number
      }],
      timestamp: {
        type: Date,
        default: Date.now
      },
      isRead: {
        type: Boolean,
        default: false
      },
      readBy: [{
        user: mongoose.Schema.Types.ObjectId,
        readAt: Date
      }],
      isEdited: {
        type: Boolean,
        default: false
      },
      isDeleted: {
        type: Boolean,
        default: false
      }
    }],
    lastMessage: {
      type: String,
      trim: true
    },
    lastMessageAt: {
      type: Date,
      default: Date.now
    },
    unreadCount: {
      type: Map,
      of: Number,
      default: {}
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isMuted: [{
      user: mongoose.Schema.Types.ObjectId,
      mutedTill: Date
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
chatSchema.index({ property: 1 });
chatSchema.index({ 'participants.user': 1 });
chatSchema.index({ lastMessageAt: -1 });
chatSchema.index({ isActive: 1 });

// Update last message info
chatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    const lastMsg = this.messages[this.messages.length - 1];
    this.lastMessage = lastMsg.message;
    this.lastMessageAt = lastMsg.timestamp;
  }
  next();
});

const Chat = mongoose.model('Chat', chatSchema);

export default Chat;
