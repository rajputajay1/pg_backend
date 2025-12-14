import mongoose from 'mongoose';

const staffSchema = new mongoose.Schema(
  {
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'PgOwner',
      required: [true, 'Owner reference is required']
    },
    property: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Property',
      required: [true, 'Property reference is required']
    },
    name: {
      type: String,
      required: [true, 'Staff name is required'],
      trim: true
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
      trim: true
    },
    password: {
      type: String,
      required: [true, 'Password is required'],
      minlength: [6, 'Password must be at least 6 characters'],
      select: false
    },
    role: {
      type: String,
      enum: ['Cook', 'Cleaner', 'Caretaker', 'Electrician', 'Plumber', 'Accountant', 'Security', 'Manager'],
      required: [true, 'Role is required']
    },
    salary: {
      type: Number,
      required: [true, 'Salary is required'],
      min: [0, 'Salary cannot be negative']
    },
    joiningDate: {
      type: Date,
      required: [true, 'Joining date is required'],
      default: Date.now
    },
    leavingDate: {
      type: Date
    },
    // Role-based Permissions
    permissions: {
      canViewRooms: {
        type: Boolean,
        default: false
      },
      canViewStudents: {
        type: Boolean,
        default: false
      },
      canViewPayments: {
        type: Boolean,
        default: false
      },
      canManageComplaints: {
        type: Boolean,
        default: false
      },
      canManageInventory: {
        type: Boolean,
        default: false
      },
      canViewReports: {
        type: Boolean,
        default: false
      },
      canManageStaff: {
        type: Boolean,
        default: false
      }
    },
    assignedRooms: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Room'
    }],
    workSchedule: {
      monday: { start: String, end: String, isOff: Boolean },
      tuesday: { start: String, end: String, isOff: Boolean },
      wednesday: { start: String, end: String, isOff: Boolean },
      thursday: { start: String, end: String, isOff: Boolean },
      friday: { start: String, end: String, isOff: Boolean },
      saturday: { start: String, end: String, isOff: Boolean },
      sunday: { start: String, end: String, isOff: Boolean }
    },
    documents: [{
      name: String,
      type: String,
      url: String,
      uploadedAt: { type: Date, default: Date.now }
    }],
    profilePhoto: {
      type: String,
      trim: true
    },
    address: {
      type: String,
      trim: true
    },
    emergencyContact: {
      name: String,
      relation: String,
      phone: String
    },
    isActive: {
      type: Boolean,
      default: true
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
staffSchema.index({ owner: 1 });
staffSchema.index({ property: 1 });
staffSchema.index({ email: 1 });
staffSchema.index({ role: 1 });
staffSchema.index({ isActive: 1 });

// Method to hide password
staffSchema.methods.toJSON = function() {
  const staff = this.toObject();
  delete staff.password;
  return staff;
};

const Staff = mongoose.model('Staff', staffSchema);

export default Staff;
