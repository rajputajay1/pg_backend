import mongoose from 'mongoose';

const furnitureSchema = new mongoose.Schema(
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
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    name: {
      type: String,
      required: [true, 'Furniture name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Bed', 'Mattress', 'Wardrobe', 'Study Table', 'Chair', 'Fan', 'Light', 'Cupboard', 'Mirror', 'Other'],
      required: [true, 'Category is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
      default: 1
    },
    condition: {
      type: String,
      enum: ['New', 'Good', 'Fair', 'Poor', 'Damaged'],
      default: 'Good'
    },
    purchaseDate: {
      type: Date
    },
    purchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative']
    },
    brand: {
      type: String,
      trim: true
    },
    model: {
      type: String,
      trim: true
    },
    serialNumber: {
      type: String,
      trim: true
    },
    warrantyExpiry: {
      type: Date
    },
    lastMaintenanceDate: {
      type: Date
    },
    nextMaintenanceDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['In Use', 'In Storage', 'Under Maintenance', 'Damaged', 'Disposed'],
      default: 'In Use'
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    images: [{
      type: String,
      trim: true
    }],
    notes: {
      type: String,
      trim: true,
      maxlength: [500, 'Notes cannot exceed 500 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes
furnitureSchema.index({ property: 1 });
furnitureSchema.index({ owner: 1 });
furnitureSchema.index({ room: 1 });
furnitureSchema.index({ category: 1 });
furnitureSchema.index({ status: 1 });

// Virtual for warranty status
furnitureSchema.virtual('isUnderWarranty').get(function() {
  if (!this.warrantyExpiry) return false;
  return new Date() < new Date(this.warrantyExpiry);
});

// Virtual for maintenance due
furnitureSchema.virtual('isMaintenanceDue').get(function() {
  if (!this.nextMaintenanceDate) return false;
  return new Date() >= new Date(this.nextMaintenanceDate);
});

const Furniture = mongoose.model('Furniture', furnitureSchema);

export default Furniture;
