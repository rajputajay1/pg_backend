import mongoose from 'mongoose';

const settingsSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User reference is required'],
      unique: true
    },
    // Profile Settings
    profile: {
      name: {
        type: String,
        trim: true
      },
      email: {
        type: String,
        trim: true,
        lowercase: true
      },
      phone: {
        type: String,
        trim: true
      },
      location: {
        type: String,
        trim: true
      },
      bio: {
        type: String,
        trim: true,
        maxlength: [500, 'Bio cannot exceed 500 characters']
      },
      avatar: {
        type: String,
        trim: true
      }
    },
    // System Settings
    system: {
      theme: {
        type: String,
        enum: ['light', 'dark', 'system'],
        default: 'system'
      },
      language: {
        type: String,
        enum: ['en', 'es', 'fr', 'de', 'hi'],
        default: 'en'
      },
      timezone: {
        type: String,
        default: 'UTC'
      },
      dateFormat: {
        type: String,
        enum: ['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'],
        default: 'DD/MM/YYYY'
      }
    },
    // Notification Settings
    notifications: {
      paymentAlerts: {
        type: Boolean,
        default: true
      },
      newOwnerRegistration: {
        type: Boolean,
        default: true
      },
      systemUpdates: {
        type: Boolean,
        default: false
      },
      reportGeneration: {
        type: Boolean,
        default: true
      },
      securityAlerts: {
        type: Boolean,
        default: true
      },
      emailNotifications: {
        type: Boolean,
        default: true
      },
      smsNotifications: {
        type: Boolean,
        default: false
      }
    },
    // Security Settings
    security: {
      twoFactorEnabled: {
        type: Boolean,
        default: false
      },
      lastPasswordChange: {
        type: Date
      },
      sessionTimeout: {
        type: Number,
        default: 30,
        min: [5, 'Session timeout must be at least 5 minutes']
      }
    },
    // Financial Settings
    financial: {
      defaultCurrency: {
        type: String,
        enum: ['USD', 'EUR', 'GBP', 'INR'],
        default: 'INR'
      },
      automaticPaymentReminders: {
        type: Boolean,
        default: true
      },
      monthlyFinancialReports: {
        type: Boolean,
        default: true
      },
      lateFeeNotifications: {
        type: Boolean,
        default: false
      },
      taxRate: {
        type: Number,
        default: 0,
        min: [0, 'Tax rate cannot be negative'],
        max: [100, 'Tax rate cannot exceed 100']
      },
      taxId: {
        type: String,
        trim: true
      }
    }
  },
  {
    timestamps: true
  }
);

// Indexes
settingsSchema.index({ user: 1 });

const Settings = mongoose.model('Settings', settingsSchema);

export default Settings;
