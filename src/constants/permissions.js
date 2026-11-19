// Every permission an admin can hold. Add new ones here as features land.
export const PERMISSIONS = [
  'users:read',
  'users:update',
  'users:delete',
  'admins:read',
  'admins:create',
  'admins:update',
  'admins:delete',
  'permissions:manage',
  'products:read',
  'products:create',
  'products:update',
  'products:delete',
  'orders:read',
  'orders:update',
  'files:upload',
  'files:delete',
];

export const ROLES = ['super_admin', 'admin', 'support'];

// Roles that can be given through the API. There is exactly one super admin, created by the seed.
export const ASSIGNABLE_ROLES = ['admin', 'support'];

// Default permissions a role starts with. The super admin always has every permission.
export const ROLE_PERMISSIONS = {
  super_admin: PERMISSIONS,
  admin: [
    'users:read',
    'users:update',
    'users:delete',
    'admins:read',
    'products:read',
    'products:create',
    'products:update',
    'products:delete',
    'orders:read',
    'orders:update',
    'files:upload',
    'files:delete',
  ],
  support: ['users:read', 'products:read', 'orders:read', 'orders:update'],
};

export const effectivePermissions = (admin) =>
  admin.role === 'super_admin' ? [...PERMISSIONS] : [...admin.permissions];

export const hasPermissions = (admin, required) =>
  admin.role === 'super_admin' || required.every((p) => admin.permissions.includes(p));
