import mongoose from 'mongoose';

const roomSchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
    roomNumber: {
      type: String,
      required: [true, 'Room number is required'],
      trim: true
    },
    roomType: {
      type: String,
      enum: ['Single', 'Double', 'Triple', 'Dormitory', 'Suite'],
      required: [true, 'Room type is required']
    },
    floor: {
      type: Number,
      min: [0, 'Floor cannot be negative']
    },
    capacity: {
      type: Number,
      required: [true, 'Room capacity is required'],
      min: [1, 'Capacity must be at least 1']
    },
    currentOccupancy: {
      type: Number,
      default: 0,
      min: [0, 'Occupancy cannot be negative']
    },
    rent: {
      type: Number,
      required: [true, 'Rent is required'],
      min: [0, 'Rent cannot be negative']
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative']
    },
    status: {
      type: String,
      enum: ['Available', 'Occupied', 'Maintenance', 'Reserved'],
      default: 'Available'
    },
    amenities: [{
      type: String,
      trim: true
    }],
    furniture: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Furniture'
    }],
    hasAttachedBathroom: {
      type: Boolean,
      default: false
    },
    hasBalcony: {
      type: Boolean,
      default: false
    },
    hasAC: {
      type: Boolean,
      default: false
    },
    area: {
      type: Number,
      min: [0, 'Area cannot be negative']
    },
    areaUnit: {
      type: String,
      enum: ['sqft', 'sqm'],
      default: 'sqft'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    isActive: {
      type: Boolean,
      default: true
    }
  },
  {
    timestamps: true
  }
);

// Indexes
roomSchema.index({ property: 1 });
roomSchema.index({ owner: 1 });
roomSchema.index({ status: 1 });
roomSchema.index({ roomType: 1 });
roomSchema.index({ property: 1, roomNumber: 1 }, { unique: true });

// Virtual for availability
roomSchema.virtual('isAvailable').get(function() {
  return this.currentOccupancy < this.capacity && this.status === 'Available';
});

// Virtual for occupancy percentage
roomSchema.virtual('occupancyPercentage').get(function() {
  if (this.capacity === 0) return 0;
  return ((this.currentOccupancy / this.capacity) * 100).toFixed(2);
});

const Room = mongoose.model('Room', roomSchema);

export default Room;
