import mongoose from 'mongoose';

const propertySchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
    name: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true
    },
    address: {
      type: String,
      required: [true, 'Property address is required'],
      trim: true
    },
    city: {
      type: String,
      required: [true, 'City is required'],
      trim: true
    },
    state: {
      type: String,
      required: [true, 'State is required'],
      trim: true
    },
    businessType: {
      type: String,
      enum: ['PG', 'Hostel', 'Rental', 'Other'],
      default: 'PG'
    },
    planName: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise'],
      required: [true, 'Plan name is required']
    },
    planPrice: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Plan price cannot be negative']
    },
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Pending'],
      default: 'Active'
    },
    websiteUrl: {
      type: String,
      trim: true
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'completed', 'failed'],
      default: 'pending'
    },
    totalRooms: {
      type: Number,
      default: 0,
      min: [0, 'Total rooms cannot be negative']
    },
    occupiedRooms: {
      type: Number,
      default: 0,
      min: [0, 'Occupied rooms cannot be negative']
    },
    amenities: [{
      type: String,
      trim: true
    }],
    description: {
      type: String,
      trim: true,
      maxlength: [2000, 'Description cannot exceed 2000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
propertySchema.index({ owner: 1 });
propertySchema.index({ city: 1 });
propertySchema.index({ status: 1 });
propertySchema.index({ businessType: 1 });

// Virtual for occupancy rate
propertySchema.virtual('occupancyRate').get(function() {
  if (this.totalRooms === 0) return 0;
  return ((this.occupiedRooms / this.totalRooms) * 100).toFixed(2);
});

const Property = mongoose.model('Property', propertySchema);

export default Property;
