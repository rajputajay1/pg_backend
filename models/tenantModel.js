import mongoose from 'mongoose';

const tenantSchema = new mongoose.Schema(
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
      ref: 'Room',
      required: [true, 'Room reference is required']
    },
    // Personal Information
    name: {
      type: String,
      required: [true, 'Tenant name is required'],
      trim: true
    },
    email: {
      type: String,
      required: [true, 'Email is required'],
      lowercase: true,
      trim: true,
      match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email']
    },
    phone: {
      type: String,
      required: [true, 'Phone number is required'],
      trim: true
    },
    alternatePhone: {
      type: String,
      trim: true
    },
    dateOfBirth: {
      type: Date
    },
    gender: {
      type: String,
      enum: ['Male', 'Female', 'Other'],
      required: [true, 'Gender is required']
    },
    bloodGroup: {
      type: String,
      enum: ['A+', 'A-', 'B+', 'B-', 'AB+', 'AB-', 'O+', 'O-']
    },
    // Address Information
    permanentAddress: {
      street: String,
      city: String,
      state: String,
      pincode: String,
      country: { type: String, default: 'India' }
    },
    // Emergency Contact
    emergencyContact: {
      name: {
        type: String,
        required: [true, 'Emergency contact name is required']
      },
      relation: {
        type: String,
        required: [true, 'Emergency contact relation is required']
      },
      phone: {
        type: String,
        required: [true, 'Emergency contact phone is required']
      }
    },
    // Occupation Details
    occupation: {
      type: String,
      enum: ['Student', 'Working Professional', 'Business', 'Other'],
      required: [true, 'Occupation is required']
    },
    companyName: {
      type: String,
      trim: true
    },
    collegeName: {
      type: String,
      trim: true
    },
    // ID Proof
    idProofType: {
      type: String,
      enum: ['Aadhar Card', 'PAN Card', 'Driving License', 'Passport', 'Voter ID', 'Other']
    },
    idProofNumber: {
      type: String,
      trim: true
    },
    idProofDocument: {
      type: String,
      trim: true
    },
    // Rental Details
    rentAmount: {
      type: Number,
      required: [true, 'Rent amount is required'],
      min: [0, 'Rent cannot be negative']
    },
    securityDeposit: {
      type: Number,
      default: 0,
      min: [0, 'Security deposit cannot be negative']
    },
    depositPaid: {
      type: Boolean,
      default: false
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    leavingDate: {
      type: Date
    },
    noticePeriod: {
      type: Number,
      default: 30,
      min: [0, 'Notice period cannot be negative']
    },
    // Meal Plan
    mealPlan: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Meal'
    },
    hasMealPlan: {
      type: Boolean,
      default: false
    },
    // Status
    status: {
      type: String,
      enum: ['Active', 'Inactive', 'Notice Period', 'Left'],
      default: 'Active'
    },
    // Payment Status
    lastPaymentDate: {
      type: Date
    },
    nextPaymentDue: {
      type: Date
    },
    paymentStatus: {
      type: String,
      enum: ['Paid', 'Pending', 'Overdue'],
      default: 'Pending'
    },
    // Documents
    documents: [{
      name: String,
      type: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    // Additional
    profilePhoto: {
      type: String,
      trim: true
    },
    notes: {
      type: String,
      trim: true,
      maxlength: [1000, 'Notes cannot exceed 1000 characters']
    },
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
tenantSchema.index({ property: 1 });
tenantSchema.index({ owner: 1 });
tenantSchema.index({ room: 1 });
tenantSchema.index({ email: 1 });
tenantSchema.index({ phone: 1 });
tenantSchema.index({ status: 1 });
tenantSchema.index({ paymentStatus: 1 });

// Virtual for age
tenantSchema.virtual('age').get(function() {
  if (!this.dateOfBirth) return null;
  const today = new Date();
  const birthDate = new Date(this.dateOfBirth);
  let age = today.getFullYear() - birthDate.getFullYear();
  const monthDiff = today.getMonth() - birthDate.getMonth();
  if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
    age--;
  }
  return age;
});

// Virtual for stay duration
tenantSchema.virtual('stayDuration').get(function() {
  const start = new Date(this.joiningDate);
  const end = this.leavingDate ? new Date(this.leavingDate) : new Date();
  const diffTime = Math.abs(end - start);
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
});

const Tenant = mongoose.model('Tenant', tenantSchema);

export default Tenant;
