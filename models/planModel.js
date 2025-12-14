import mongoose from 'mongoose';

const planSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Plan name is required'],
      trim: true,
      unique: true,
    },
    price: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Price cannot be negative'],
    },
    period: {
      type: String,
      required: [true, 'Plan period is required'],
      enum: ['month', 'year', 'lifetime'],
      default: 'month',
    },
    description: {
      type: String,
      required: [true, 'Plan description is required'],
      trim: true,
    },
    features: {
      type: [String],
      required: [true, 'Plan features are required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one feature is required',
      },
    },
    allowedModules: {
      type: [String],
      required: [true, 'Allowed modules are required'],
      validate: {
        validator: function(v) {
          return v && v.length > 0;
        },
        message: 'At least one module must be allowed',
      },
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    displayOrder: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster queries
planSchema.index({ isActive: 1, displayOrder: 1 });

const Plan = mongoose.model('Plan', planSchema);

export default Plan;
