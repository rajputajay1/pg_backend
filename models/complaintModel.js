import mongoose from 'mongoose';

const complaintSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant reference is required']
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room',
      required: [true, 'Room reference is required']
    },
    category: {
      type: String,
      enum: ['Electricity', 'Plumbing', 'Furniture', 'Cleaning', 'AC/Fan', 'WiFi', 'Security', 'Other'],
      required: [true, 'Category is required']
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: [100, 'Title cannot exceed 100 characters']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    priority: {
      type: String,
      enum: ['Low', 'Medium', 'High', 'Urgent'],
      default: 'Medium'
    },
    status: {
      type: String,
      enum: ['Pending', 'Assigned', 'In Progress', 'Resolved', 'Closed', 'Rejected'],
      default: 'Pending'
    },
    assignedTo: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    photos: [{
      type: String,
      trim: true
    }],
    resolvedPhotos: [{
      type: String,
      trim: true
    }],
    assignedAt: {
      type: Date
    },
    resolvedAt: {
      type: Date
    },
    estimatedCost: {
      type: Number,
      min: [0, 'Estimated cost cannot be negative'],
      default: 0
    },
    actualCost: {
      type: Number,
      min: [0, 'Actual cost cannot be negative'],
      default: 0
    },
    resolutionNotes: {
      type: String,
      trim: true,
      maxlength: [500, 'Resolution notes cannot exceed 500 characters']
    },
    rating: {
      type: Number,
      min: [1, 'Rating must be at least 1'],
      max: [5, 'Rating cannot exceed 5']
    },
    feedback: {
      type: String,
      trim: true,
      maxlength: [500, 'Feedback cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
complaintSchema.index({ property: 1 });
complaintSchema.index({ tenant: 1 });
complaintSchema.index({ room: 1 });
complaintSchema.index({ status: 1 });
complaintSchema.index({ category: 1 });
complaintSchema.index({ priority: 1 });
complaintSchema.index({ assignedTo: 1 });
complaintSchema.index({ createdAt: -1 });

// Virtual for resolution time
complaintSchema.virtual('resolutionTime').get(function() {
  if (!this.resolvedAt) return null;
  const diffTime = Math.abs(new Date(this.resolvedAt) - new Date(this.createdAt));
  const diffHours = Math.ceil(diffTime / (1000 * 60 * 60));
  return diffHours;
});

const Complaint = mongoose.model('Complaint', complaintSchema);

export default Complaint;
