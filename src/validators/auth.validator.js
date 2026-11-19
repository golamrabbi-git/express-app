import { z } from 'zod';
import { atLeastOne, avatarSchema, emailSchema, nameSchema, passwordSchema, phoneSchema } from './common.js';

const requiredPassword = z.string({ error: 'Password is required' }).min(1, 'Password is required');

// Users: phone is required and is the main identifier; email is optional.
export const registerSchema = z.object({
  name: nameSchema,
  phone: phoneSchema,
  email: emailSchema.optional(),
  password: passwordSchema,
  avatar: avatarSchema.optional(),
});

// Users log in with exactly one of phone or email.
export const loginSchema = z
  .object({
    phone: phoneSchema.optional(),
    email: emailSchema.optional(),
    password: requiredPassword,
  })
  .refine((b) => (b.phone === undefined) !== (b.email === undefined), {
    path: ['phone'],
    message: 'Provide either phone or email (not both)',
  });

// Admins always log in with email.
export const adminLoginSchema = z.object({
  email: emailSchema,
  password: requiredPassword,
});

export const refreshTokenSchema = z.object({
  refreshToken: z.string({ error: 'refreshToken is required' }).min(1, 'refreshToken is required'),
});

// PATCH /api/auth/me. Phone can be changed but not removed; send null for email or avatar to remove it.
const PROFILE_FIELDS = ['name', 'phone', 'email', 'avatar'];
export const updateProfileSchema = z
  .object({
    name: nameSchema.optional(),
    phone: phoneSchema.optional(),
    email: emailSchema.nullable().optional(),
    avatar: avatarSchema.nullable().optional(),
  })
  .refine(atLeastOne(PROFILE_FIELDS), { message: `Provide at least one of: ${PROFILE_FIELDS.join(', ')}` });
