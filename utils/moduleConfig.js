// Module configuration for plan-based access control
// This file defines all available modules in the system

export const MODULES = {
  DASHBOARD: 'dashboard',
  ROOMS: 'rooms',
  TENANTS: 'tenants',
  STAFF: 'staff',
  FINANCE: 'finance',
  PAYMENTS: 'payments',
  EXPENSES: 'expenses',
  COMPLAINTS: 'complaints',
  NOTICES: 'notices',
  MEALS: 'meals',
  CLEANING: 'cleaning',
  INVENTORY: 'inventory',
  FURNITURE: 'furniture',
  UTILITIES: 'utilities',
  SECURITY_DEPOSITS: 'security_deposits',
  REPORTS: 'reports',
  SETTINGS: 'settings',
  CHAT: 'chat',
};

// Module metadata with display names and descriptions
export const MODULE_INFO = {
  [MODULES.DASHBOARD]: {
    name: 'Dashboard',
    description: 'Overview and analytics',
    category: 'core',
  },
  [MODULES.ROOMS]: {
    name: 'Room Management',
    description: 'Manage rooms and availability',
    category: 'core',
  },
  [MODULES.TENANTS]: {
    name: 'Tenant Management',
    description: 'Manage tenant information',
    category: 'core',
  },
  [MODULES.STAFF]: {
    name: 'Staff Management',
    description: 'Manage staff and roles',
    category: 'operations',
  },
  [MODULES.FINANCE]: {
    name: 'Finance',
    description: 'Financial overview and reports',
    category: 'finance',
  },
  [MODULES.PAYMENTS]: {
    name: 'Payments',
    description: 'Track rent and payments',
    category: 'finance',
  },
  [MODULES.EXPENSES]: {
    name: 'Expenses',
    description: 'Manage expenses and bills',
    category: 'finance',
  },
  [MODULES.COMPLAINTS]: {
    name: 'Complaints',
    description: 'Handle tenant complaints',
    category: 'operations',
  },
  [MODULES.NOTICES]: {
    name: 'Notices',
    description: 'Send announcements and notices',
    category: 'communication',
  },
  [MODULES.MEALS]: {
    name: 'Meal Management',
    description: 'Manage meal plans and menus',
    category: 'operations',
  },
  [MODULES.CLEANING]: {
    name: 'Cleaning Schedule',
    description: 'Schedule and track cleaning',
    category: 'operations',
  },
  [MODULES.INVENTORY]: {
    name: 'Inventory',
    description: 'Track inventory and supplies',
    category: 'operations',
  },
  [MODULES.FURNITURE]: {
    name: 'Furniture',
    description: 'Manage furniture and assets',
    category: 'operations',
  },
  [MODULES.UTILITIES]: {
    name: 'Utilities',
    description: 'Track utility bills and usage',
    category: 'finance',
  },
  [MODULES.SECURITY_DEPOSITS]: {
    name: 'Security Deposits',
    description: 'Manage security deposits',
    category: 'finance',
  },
  [MODULES.REPORTS]: {
    name: 'Reports',
    description: 'Generate various reports',
    category: 'analytics',
  },
  [MODULES.SETTINGS]: {
    name: 'Settings',
    description: 'System settings and preferences',
    category: 'core',
  },
  [MODULES.CHAT]: {
    name: 'Chat',
    description: 'Communication with tenants',
    category: 'communication',
  },
};

// Predefined plan templates
export const PLAN_TEMPLATES = {
  BASIC: {
    name: 'Basic Plan (₹599)',
    modules: [
      MODULES.DASHBOARD,
      MODULES.ROOMS,
      MODULES.TENANTS,
      MODULES.PAYMENTS,
      MODULES.SETTINGS,
    ],
  },
  STANDARD: {
    name: 'Standard Plan (₹999)',
    modules: [
      MODULES.DASHBOARD,
      MODULES.ROOMS,
      MODULES.TENANTS,
      MODULES.STAFF,
      MODULES.FINANCE,
      MODULES.PAYMENTS,
      MODULES.EXPENSES,
      MODULES.COMPLAINTS,
      MODULES.NOTICES,
      MODULES.SETTINGS,
    ],
  },
  PREMIUM: {
    name: 'Premium Plan (₹2599)',
    modules: Object.values(MODULES), // All modules
  },
};

// Helper function to validate module names
export const isValidModule = (moduleName) => {
  return Object.values(MODULES).includes(moduleName);
};

// Helper function to validate array of modules
export const validateModules = (modules) => {
  if (!Array.isArray(modules)) {
    return { valid: false, error: 'Modules must be an array' };
  }

  const invalidModules = modules.filter(m => !isValidModule(m));
  
  if (invalidModules.length > 0) {
    return { 
      valid: false, 
      error: `Invalid modules: ${invalidModules.join(', ')}` 
    };
  }

  return { valid: true };
};

// Get all available modules
export const getAllModules = () => {
  return Object.values(MODULES);
};

// Get modules by category
export const getModulesByCategory = (category) => {
  return Object.entries(MODULE_INFO)
    .filter(([_, info]) => info.category === category)
    .map(([module, _]) => module);
};

export default {
  MODULES,
  MODULE_INFO,
  PLAN_TEMPLATES,
  isValidModule,
  validateModules,
  getAllModules,
  getModulesByCategory,
};
