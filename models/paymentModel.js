import mongoose from 'mongoose';

const paymentSchema = new mongoose.Schema(
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
    amount: {
      type: Number,
      required: [true, 'Payment amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    dueDate: {
      type: Date,
      required: [true, 'Due date is required']
    },
    paidDate: {
      type: Date
    },
    status: {
      type: String,
      enum: ['pending', 'paid', 'overdue', 'failed'],
      default: 'pending'
    },
    method: {
      type: String,
      enum: ['Razorpay', 'Cash', 'Bank Transfer', 'UPI', 'Other'],
      trim: true
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
    razorpayOrderId: {
      type: String,
      trim: true
    },
    razorpaySignature: {
      type: String,
      trim: true
    },
    planName: {
      type: String,
      enum: ['Starter', 'Professional', 'Enterprise'],
      required: [true, 'Plan name is required']
    },
    description: {
      type: String,
      trim: true
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
paymentSchema.index({ owner: 1 });
paymentSchema.index({ status: 1 });
paymentSchema.index({ dueDate: 1 });
paymentSchema.index({ transactionId: 1 });
paymentSchema.index({ razorpayPaymentId: 1 });

// Virtual for days overdue
paymentSchema.virtual('daysOverdue').get(function() {
  if (this.status !== 'overdue') return 0;
  const today = new Date();
  const due = new Date(this.dueDate);
  const diffTime = Math.abs(today - due);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const Payment = mongoose.model('Payment', paymentSchema);

export default Payment;
