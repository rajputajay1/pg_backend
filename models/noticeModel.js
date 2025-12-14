import mongoose from 'mongoose';

const noticeSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [200, 'Title cannot exceed 200 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    },
    category: {
      type: String,
      enum: ['General', 'Maintenance', 'Payment', 'Event', 'Emergency', 'Holiday', 'Rule Change'],
      required: [true, 'Category is required']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    targetAudience: {
      type: String,
      enum: ['All', 'Students', 'Staff', 'Specific Rooms', 'Specific Students'],
      default: 'All'
    },
    targetRooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }],
    targetStudents: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant'
    }],
    validFrom: {
      type: Date,
      required: [true, 'Valid from date is required'],
      default: Date.now
    },
    validTill: {
      type: Date
    },
    attachments: [{
      name: String,
      url: String,
      type: String
    }],
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Created by is required']
    },
    isActive: {
      type: Boolean,
      default: true
    },
    isPinned: {
      type: Boolean,
      default: false
    },
    readBy: [{
      user: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'readBy.userType'
      },
      userType: {
        type: String,
        enum: ['Tenant', 'Staff']
      },
      readAt: {
        type: Date,
        default: Date.now
      }
    }]
  },
  {
    timestamps: true
  }
);

// Indexes
noticeSchema.index({ property: 1 });
noticeSchema.index({ category: 1 });
noticeSchema.index({ priority: 1 });
noticeSchema.index({ isActive: 1 });
noticeSchema.index({ validFrom: -1 });
noticeSchema.index({ isPinned: -1 });

// Virtual for read count
noticeSchema.virtual('readCount').get(function() {
  return this.readBy ? this.readBy.length : 0;
});

// Auto-deactivate expired notices
noticeSchema.pre('save', function(next) {
  if (this.validTill && new Date() > new Date(this.validTill)) {
    this.isActive = false;
  }
  next();
});

const Notice = mongoose.model('Notice', noticeSchema);

export default Notice;
