import mongoose from 'mongoose';

const expenseSchema = new mongoose.Schema(
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
    category: {
      type: String,
      enum: ['Groceries', 'Electricity Bill', 'Water Bill', 'Gas Bill', 'Internet Bill', 'Staff Salary', 'Repairs', 'Furniture', 'Maintenance', 'Cleaning Supplies', 'Other'],
      required: [true, 'Category is required']
    },
    amount: {
      type: Number,
      required: [true, 'Amount is required'],
      min: [0, 'Amount cannot be negative']
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters']
    },
    paidTo: {
      type: String,
      required: [true, 'Paid to is required'],
      trim: true
    },
    paymentMethod: {
      type: String,
      enum: ['Cash', 'UPI', 'Bank Transfer', 'Cheque', 'Card', 'Other'],
      required: [true, 'Payment method is required']
    },
    billPhoto: {
      type: String,
      trim: true
    },
    status: {
      type: String,
      enum: ['paid', 'pending', 'overdue', 'failed'],
      default: 'paid'
    },
    date: {
      type: Date,
      required: [true, 'Date is required'],
      default: Date.now
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'Added by is required']
    },
    isRecurring: {
      type: Boolean,
      default: false
    },
    recurringPeriod: {
      type: String,
      enum: ['Daily', 'Weekly', 'Monthly', 'Quarterly', 'Yearly'],
      required: function() {
        return this.isRecurring;
      }
    },
    nextDueDate: {
      type: Date
    },
    staff: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Staff'
    },
    invoiceNumber: {
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
expenseSchema.index({ property: 1 });
expenseSchema.index({ category: 1 });
expenseSchema.index({ date: -1 });
expenseSchema.index({ addedBy: 1 });
expenseSchema.index({ isRecurring: 1 });

const Expense = mongoose.model('Expense', expenseSchema);

export default Expense;
