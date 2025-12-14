import mongoose from 'mongoose';

const inventorySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true
    },
    category: {
      type: String,
      enum: ['Vegetables', 'Fruits', 'Grains', 'Pulses', 'Spices', 'Dairy', 'Meat', 'Cleaning', 'Electrical', 'Plumbing', 'Other'],
      required: [true, 'Category is required']
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [0, 'Quantity cannot be negative'],
      default: 0
    },
    unit: {
      type: String,
      enum: ['kg', 'gram', 'liter', 'ml', 'piece', 'packet', 'box', 'dozen'],
      required: [true, 'Unit is required']
    },
    minStockLevel: {
      type: Number,
      required: [true, 'Minimum stock level is required'],
      min: [0, 'Min stock level cannot be negative']
    },
    currentStock: {
      type: Number,
      required: [true, 'Current stock is required'],
      min: [0, 'Current stock cannot be negative'],
      default: 0
    },
    lastPurchaseDate: {
      type: Date
    },
    lastPurchasePrice: {
      type: Number,
      min: [0, 'Purchase price cannot be negative']
    },
    lastPurchaseQuantity: {
      type: Number,
      min: [0, 'Purchase quantity cannot be negative']
    },
    supplier: {
      name: String,
      phone: String,
      address: String
    },
    expiryDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['In Stock', 'Low Stock', 'Out of Stock', 'Expired'],
      default: 'In Stock'
    },
    requestedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    requestDate: {
      type: Date
    },
    requestQuantity: {
      type: Number,
      min: [0, 'Request quantity cannot be negative']
    },
    requestStatus: {
      type: String,
      enum: ['Pending', 'Approved', 'Ordered', 'Received', 'Rejected'],
      default: 'Pending'
    },
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
inventorySchema.index({ property: 1 });
inventorySchema.index({ category: 1 });
inventorySchema.index({ status: 1 });
inventorySchema.index({ itemName: 1 });

// Auto-update status based on stock level
inventorySchema.pre('save', function(next) {
  if (this.currentStock === 0) {
    this.status = 'Out of Stock';
  } else if (this.currentStock <= this.minStockLevel) {
    this.status = 'Low Stock';
  } else if (this.expiryDate && new Date() > new Date(this.expiryDate)) {
    this.status = 'Expired';
  } else {
    this.status = 'In Stock';
  }
  next();
});

const Inventory = mongoose.model('Inventory', inventorySchema);

export default Inventory;
