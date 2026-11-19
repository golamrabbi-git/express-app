import { z } from 'zod';
import { ASSIGNABLE_ROLES, PERMISSIONS, ROLES } from '../constants/permissions.js';
import {
  atLeastOne,
  avatarSchema,
  enumSchema,
  emailSchema,
  nameSchema,
  paginationShape,
  passwordSchema,
  phoneSchema,
  statusSchema,
} from './common.js';

const assignableRole = enumSchema(ASSIGNABLE_ROLES, 'role');

const permissionList = z
  .array(z.enum(PERMISSIONS, { error: 'Unknown permission (see GET /api/admin/permissions)' }), {
    error: 'permissions must be an array of permission names',
  })
  .transform((list) => [...new Set(list)]);

export const changePasswordSchema = z
  .object({
    currentPassword: z.string({ error: 'currentPassword is required' }).min(1, 'currentPassword is required'),
    newPassword: passwordSchema,
  })
  .refine((b) => b.currentPassword !== b.newPassword, {
    path: ['newPassword'],
    message: 'New password must differ from the current one',
  });

export const createAdminSchema = z.object({
  name: nameSchema,
  email: emailSchema,
  phone: phoneSchema.optional(),
  password: passwordSchema,
  role: assignableRole.default('admin'),
  permissions: permissionList.optional(),
});

const ADMIN_UPDATE_FIELDS = ['name', 'phone', 'role', 'status'];
export const updateAdminSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.nullable().optional(), // null removes it
    role: assignableRole.optional(),
    status: statusSchema.optional(),
  })
  .refine(atLeastOne(ADMIN_UPDATE_FIELDS), { message: `Provide at least one of: ${ADMIN_UPDATE_FIELDS.join(', ')}` });

export const permissionsSchema = z.object({ permissions: permissionList });

// Phone can be changed but not removed; send null for email or avatar to remove it.
const USER_UPDATE_FIELDS = ['name', 'phone', 'email', 'avatar', 'status'];
export const updateUserSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.nullable().optional(),
    avatar: avatarSchema.nullable().optional(),
    status: statusSchema.optional(),
  })
  .refine(atLeastOne(USER_UPDATE_FIELDS), { message: `Provide at least one of: ${USER_UPDATE_FIELDS.join(', ')}` });

export const adminListQuerySchema = z.object({
  ...paginationShape,
  role: enumSchema(ROLES, 'role').optional(),
  status: statusSchema.optional(),
});

export const userListQuerySchema = z.object({
  ...paginationShape,
  status: statusSchema.optional(),
});
