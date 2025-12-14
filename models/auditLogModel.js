import mongoose from 'mongoose';

const auditLogSchema = new mongoose.Schema(
  {
    user: {
      type: String,
      required: [true, 'User is required'],
      trim: true
    },
    userRole: {
      type: String,
      enum: ['Super Admin', 'Admin', 'Owner', 'System'],
      required: [true, 'User role is required']
    },
    action: {
      type: String,
      enum: ['CREATE', 'UPDATE', 'DELETE', 'LOGIN', 'LOGOUT', 'VIEW', 'PAYMENT', 'FAILED_LOGIN'],
      required: [true, 'Action is required']
    },
    resource: {
      type: String,
      required: [true, 'Resource is required'],
      trim: true
    },
    resourceId: {
      type: String,
      trim: true
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      trim: true,
      maxlength: [1000, 'Description cannot exceed 1000 characters']
    },
    ipAddress: {
      type: String,
      trim: true,
      default: '127.0.0.1'
    },
    userAgent: {
      type: String,
      trim: true
    },
    severity: {
      type: String,
      enum: ['info', 'warning', 'error', 'critical'],
      default: 'info'
    },
    category: {
      type: String,
      enum: [
        'user_management',
        'property_management',
        'plan_management',
        'financial',
        'authentication',
        'security',
        'system'
      ],
      required: [true, 'Category is required']
    },
    metadata: {
      type: mongoose.Schema.Types.Mixed,
      default: {}
    }
  },
  {
    timestamps: true
  }
);

// Indexes for efficient querying
auditLogSchema.index({ user: 1 });
auditLogSchema.index({ action: 1 });
auditLogSchema.index({ category: 1 });
auditLogSchema.index({ severity: 1 });
auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ resource: 1, resourceId: 1 });

// Compound index for common queries
auditLogSchema.index({ category: 1, severity: 1, createdAt: -1 });

const AuditLog = mongoose.model('AuditLog', auditLogSchema);

export default AuditLog;
