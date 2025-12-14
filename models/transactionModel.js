import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
    ownerName: {
      type: String,
      required: [true, 'Owner name is required'],
      trim: true
    },
    ownerEmail: {
      type: String,
      required: [true, 'Owner email is required'],
      trim: true
    },
    ownerPhone: {
      type: String,
      required: [true, 'Owner phone is required'],
      trim: true
    },
    propertyName: {
      type: String,
      required: [true, 'Property name is required'],
      trim: true
    },
    type: {
      type: String,
      enum: ['credit', 'debit'],
      required: [true, 'Transaction type is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true
    },
    method: {
      type: String,
      enum: ['Razorpay', 'Cash', 'Bank Transfer', 'UPI', 'Other'],
      trim: true
    },
    status: {
      type: String,
      enum: ['pending', 'completed', 'failed', 'overdue'],
      default: 'pending'
    },
    transactionId: {
      type: String,
      trim: true,
      unique: true,
      sparse: true
    },
    razorpayPaymentId: {
      type: String,
      trim: true
    },
    planName: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise']
    },
    businessType: {
      type: String,
      enum: ['PG', 'Hostel', 'Rental', 'Other']
    },
    websiteUrl: {
      type: String,
      trim: true
    },
    daysOverdue: {
      type: Number,
      default: 0,
      min: [0, 'Days overdue cannot be negative']
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
transactionSchema.index({ owner: 1 });
transactionSchema.index({ type: 1 });
transactionSchema.index({ status: 1 });
transactionSchema.index({ transactionId: 1 });
transactionSchema.index({ createdAt: -1 });

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
