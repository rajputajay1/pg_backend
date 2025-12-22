import mongoose from 'mongoose';

const securityDepositSchema = new mongoose.Schema(
  {
    tenant: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Tenant',
      required: [true, 'Tenant reference is required']
    },
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
    depositAmount: {
      type: Number,
      required: [true, 'Deposit amount is required'],
      min: [0, 'Deposit amount cannot be negative']
    },
    depositDate: {
      type: Date,
      required: [true, 'Deposit date is required'],
      default: Date.now
    },
    depositReceipt: {
      type: String,
      trim: true
    },
    deductions: [{
      reason: {
        type: String,
        required: true,
        trim: true
      },
      category: {
        type: String,
        enum: ['Room Damage', 'Unpaid Bills', 'Cleaning Charges', 'Lost Items', 'Other']
      },
      amount: {
        type: Number,
        required: true,
        min: [0, 'Amount cannot be negative']
      },
      photo: String,
      date: {
        type: Date,
        default: Date.now
      },
      approvedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      notes: String
    }],
    totalDeductions: {
      type: Number,
      default: 0,
      min: [0, 'Total deductions cannot be negative']
    },
    refundAmount: {
      type: Number,
      min: [0, 'Refund amount cannot be negative']
    },
    refundDate: {
      type: Date
    },
    refundMethod: {
      type: String,
      enum: ['Cash', 'Bank Transfer', 'UPI', 'Cheque']
    },
    refundTransactionId: {
      type: String,
      trim: true
    },
    refundStatus: {
      type: String,
      enum: ['Pending', 'Processing', 'Completed', 'Rejected'],
      default: 'Pending'
    },
    exitDate: {
      type: Date
    },
    exitInspection: {
      inspectedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Staff'
      },
      inspectionDate: Date,
      roomCondition: {
        type: String,
        enum: ['Excellent', 'Good', 'Fair', 'Poor']
      },
      photos: [String],
      notes: String
    },
    tenantAcknowledgement: {
      acknowledged: {
        type: Boolean,
        default: false
      },
      acknowledgedAt: Date,
      signature: String,
      comments: String
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

// Indexes
securityDepositSchema.index({ tenant: 1 });
securityDepositSchema.index({ property: 1 });
securityDepositSchema.index({ room: 1 });
securityDepositSchema.index({ refundStatus: 1 });

// Auto-calculate refund amount
securityDepositSchema.pre('save', function(next) {
  // Calculate total deductions
  if (this.deductions && this.deductions.length > 0) {
    this.totalDeductions = this.deductions.reduce((sum, deduction) => sum + deduction.amount, 0);
  }
  
  // Calculate refund amount
  this.refundAmount = Math.max(0, this.depositAmount - this.totalDeductions);
  
  next();
});

const SecurityDeposit = mongoose.model('SecurityDeposit', securityDepositSchema);

export default SecurityDeposit;
