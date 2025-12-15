import mongoose from 'mongoose';

const pgOwnerSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true,
      minlength: [2, 'Name must be at least 2 characters'],
      maxlength: [100, 'Name cannot exceed 100 characters']
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      unique: true,
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true,
      match: [/^[0-9+\-\s()]+$/, 'Please provide a valid phone number']
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    pgName: {
      type: String,
      trim: true
    },
    pgAddress: {
      type: String,
      trim: true
    },
    noOfPgs: {
      type: Number,
      default: 1,
      min: [1, 'Number of PGs must be at least 1']
    },
    city: {
      type: String,
      trim: true
    },
    state: {
      type: String,
      trim: true
    },
    businessType: {
      type: String,
      enum: ['PG', 'Hostel', 'Rental', 'Other'],
      default: 'PG'
    },
    // Plan Information
    planId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Plan',
      required: [true, 'Plan is required']
    },
    planName: {
      type: String,
      required: [true, 'Plan name is required']
    },
    planPrice: {
      type: Number,
      required: [true, 'Plan price is required'],
      min: [0, 'Plan price cannot be negative']
    },
    planPeriod: {
      type: String,
      enum: ['month', 'year', 'lifetime'],
      default: 'month'
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
    transactionId: {
      type: String,
      trim: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    paymentDate: {
      type: Date
    },
    planStartDate: {
      type: Date
    },
    planEndDate: {
      type: Date
    },
    isActive: {
      type: Boolean,
      default: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    }
  },
  {
    timestamps: true
  }
);

// Indexes for better query performance
pgOwnerSchema.index({ email: 1 });
pgOwnerSchema.index({ phone: 1 });
pgOwnerSchema.index({ paymentStatus: 1 });
pgOwnerSchema.index({ isActive: 1 });
pgOwnerSchema.index({ planId: 1 });
pgOwnerSchema.index({ planName: 1 });

// Virtual for total properties
pgOwnerSchema.virtual('totalProperties').get(function() {
  return this.noOfPgs;
});

// Method to hide sensitive data
pgOwnerSchema.methods.toJSON = function() {
  const owner = this.toObject();
  delete owner.password;
  return owner;
};

const PgOwner = mongoose.model('PgOwner', pgOwnerSchema);

export default PgOwner;
