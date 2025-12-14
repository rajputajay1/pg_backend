import mongoose from 'mongoose';

const utilitySchema = new mongoose.Schema(
  {
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    room: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    },
    utilityType: {
      type: String,
      enum: ['Electricity', 'Water', 'Gas'],
      required: [true, 'Utility type is required']
    },
    meterNumber: {
      type: String,
      trim: true
    },
    previousReading: {
      type: Number,
      required: [true, 'Previous reading is required'],
      min: [0, 'Reading cannot be negative']
    },
    currentReading: {
      type: Number,
      required: [true, 'Current reading is required'],
      min: [0, 'Reading cannot be negative']
    },
    consumption: {
      type: Number,
      min: [0, 'Consumption cannot be negative']
    },
    readingDate: {
      type: Date,
      required: [true, 'Reading date is required'],
      default: Date.now
    },
    meterPhoto: {
      type: String,
      trim: true
    },
    billAmount: {
      type: Number,
      min: [0, 'Bill amount cannot be negative']
    },
    billPhoto: {
      type: String,
      trim: true
    },
    paidStatus: {
      type: String,
      enum: ['Pending', 'Paid', 'Overdue'],
      default: 'Pending'
    },
    paidDate: {
      type: Date
    },
    recordedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    billingPeriod: {
      startDate: Date,
      endDate: Date
    },
    ratePerUnit: {
      type: Number,
      min: [0, 'Rate cannot be negative']
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
utilitySchema.index({ property: 1 });
utilitySchema.index({ room: 1 });
utilitySchema.index({ utilityType: 1 });
utilitySchema.index({ readingDate: -1 });
utilitySchema.index({ paidStatus: 1 });

// Auto-calculate consumption
utilitySchema.pre('save', function(next) {
  if (this.currentReading && this.previousReading) {
    this.consumption = this.currentReading - this.previousReading;
    
    // Auto-calculate bill amount if rate is provided
    if (this.ratePerUnit && !this.billAmount) {
      this.billAmount = this.consumption * this.ratePerUnit;
    }
  }
  next();
});

const Utility = mongoose.model('Utility', utilitySchema);

export default Utility;
