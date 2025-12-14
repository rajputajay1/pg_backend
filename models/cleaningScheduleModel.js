import mongoose from 'mongoose';

const cleaningScheduleSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required']
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff',
      required: [true, 'Assigned staff is required']
    },
    scheduledDate: {
      type: Date,
      required: [true, 'Scheduled date is required']
    },
    scheduledTime: {
      type: String,
      trim: true
    },
    cleaningType: {
      type: String,
      enum: ['Daily', 'Deep Cleaning', 'Special', 'Emergency'],
      default: 'Daily'
    },
    status: {
      type: String,
      enum: ['Pending', 'In Progress', 'Completed', 'Verified', 'Skipped', 'Cancelled'],
      default: 'Pending'
    },
    beforePhotos: [{
      type: String,
      trim: true
    }],
    afterPhotos: [{
      type: String,
      trim: true
    }],
    startTime: {
      type: Date
    },
    endTime: {
      type: Date
    },
    verifiedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    verifiedAt: {
      type: Date
    },
    verificationStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Rejected', 'Needs Rework']
    },
    verificationNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Verification notes cannot exceed 500 characters']
    },
    checklist: [{
      item: {
        type: String,
        required: true
      },
      isCompleted: {
        type: Boolean,
        default: false
      }
    }],
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    skipReason: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPattern: {
      type: String,
      enum: ['Daily', 'Weekly', 'Bi-Weekly', 'Monthly']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
cleaningScheduleSchema.index({ property: 1 });
cleaningScheduleSchema.index({ room: 1 });
cleaningScheduleSchema.index({ assignedTo: 1 });
cleaningScheduleSchema.index({ scheduledDate: -1 });
cleaningScheduleSchema.index({ status: 1 });

// Virtual for duration
cleaningScheduleSchema.virtual('duration').get(function() {
  if (!this.startTime || !this.endTime) return null;
  const diffTime = Math.abs(new Date(this.endTime) - new Date(this.startTime));
  const diffMinutes = Math.ceil(diffTime / (1000 * 60));
  return diffMinutes;
});

// Virtual for checklist completion percentage
cleaningScheduleSchema.virtual('completionPercentage').get(function() {
  if (!this.checklist || this.checklist.length === 0) return 0;
  const completed = this.checklist.filter(item => item.isCompleted).length;
  return ((completed / this.checklist.length) * 100).toFixed(2);
});

const CleaningSchedule = mongoose.model('CleaningSchedule', cleaningScheduleSchema);

export default CleaningSchedule;
