import jwt from 'jsonwebtoken';
import PgOwner from '../models/pgOwnerModel.js';
import Plan from '../models/planModel.js';

// Middleware to check if PG owner has access to a specific module
export const checkModuleAccess = (requiredModule) => {
  return async (req, res, next) => {
    try {
      // Check if user is authenticated
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Authentication required',
        });
      }

      // Super admin has access to everything
      if (req.user.role === 'admin') {
        return next();
      }

      // For PG owners, check their plan's allowed modules
      if (req.user.role === 'pg_owner') {
        // Get PG owner details
        const pgOwner = await PgOwner.findById(req.user.id).populate('planId');

        if (!pgOwner) {
          return res.status(404).json({
            success: false,
            message: 'PG owner not found',
          });
        }

        // Check if plan exists and is active
        if (!pgOwner.planId || !pgOwner.planId.isActive) {
          return res.status(403).json({
            success: false,
            message: 'Your subscription plan is inactive. Please contact support.',
          });
        }

        // Check if module is in allowed modules
        const allowedModules = pgOwner.planId.allowedModules || [];
        
        if (!allowedModules.includes(requiredModule)) {
          return res.status(403).json({
            success: false,
            message: `Access denied. This feature is not included in your ${pgOwner.planName} plan. Please upgrade to access this module.`,
            requiredModule,
            currentPlan: pgOwner.planName,
            allowedModules,
          });
        }

        // User has access
        return next();
      }

      // Unknown role
      return res.status(403).json({
        success: false,
        message: 'Access denied',
      });
    } catch (error) {
      console.error('Module access check error:', error);
      return res.status(500).json({
        success: false,
        message: 'Error checking module access',
      });
    }
  };
};

// Middleware to attach user's allowed modules to request
export const attachUserModules = async (req, res, next) => {
  try {
    if (!req.user) {
      return next();
    }

    // Super admin has all modules
    if (req.user.role === 'admin') {
      req.userModules = 'all';
      return next();
    }

    // For PG owners, get their plan's modules
    if (req.user.role === 'pg_owner') {
      const pgOwner = await PgOwner.findById(req.user.id).populate('planId');
      
      if (pgOwner && pgOwner.planId) {
        req.userModules = pgOwner.planId.allowedModules || [];
      } else {
        req.userModules = [];
      }
    }

    next();
  } catch (error) {
    console.error('Attach user modules error:', error);
    next();
  }
};

// Helper function to check if user has access to module (for use in controllers)
export const hasModuleAccess = async (userId, userRole, requiredModule) => {
  try {
    // Super admin has access to everything
    if (userRole === 'admin') {
      return { hasAccess: true };
    }

    // For PG owners, check their plan
    if (userRole === 'pg_owner') {
      const pgOwner = await PgOwner.findById(userId).populate('planId');

      if (!pgOwner || !pgOwner.planId) {
        return { 
          hasAccess: false, 
          message: 'Plan not found' 
        };
      }

      const allowedModules = pgOwner.planId.allowedModules || [];
      const hasAccess = allowedModules.includes(requiredModule);

      return {
        hasAccess,
        message: hasAccess 
          ? 'Access granted' 
          : `This feature is not included in your ${pgOwner.planName} plan`,
        allowedModules,
      };
    }

    return { hasAccess: false, message: 'Invalid user role' };
  } catch (error) {
    console.error('Has module access error:', error);
    return { hasAccess: false, message: 'Error checking access' };
  }
};

export default {
  checkModuleAccess,
  attachUserModules,
  hasModuleAccess,
};
