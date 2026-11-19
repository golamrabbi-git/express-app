import { z } from 'zod';

// Shared field schemas. Each field yields one clear message (the validate middleware keeps the first per field).

export const nameSchema = z
  .string({ error: 'Name is required (1-50 characters)' })
  .trim()
  .min(1, 'Name is required (1-50 characters)')
  .max(50, 'Name is required (1-50 characters)');

export const emailSchema = z
  .string({ error: 'A valid email is required' })
  .trim()
  .toLowerCase()
  .max(254, 'A valid email is required')
  .pipe(z.email('A valid email is required'));

export const passwordSchema = z
  .string({ error: 'Password must be 8-72 characters' })
  .min(8, 'Password must be 8-72 characters')
  .max(72, 'Password must be 8-72 characters')
  .regex(/[A-Za-z]/, 'Password must contain at least one letter and one digit')
  .regex(/\d/, 'Password must contain at least one letter and one digit');

const PHONE_MESSAGE = 'Phone must be a valid number, e.g. 01712345678 or +8801712345678';
// Bangladeshi mobile: 01[3-9] + 8 digits, written locally (01...) or with the country code (+880 / 880).
const BD_MOBILE = /^(?:\+?880|0)(1[3-9]\d{8})$/;
// Any other international number (E.164): + then 8-15 digits.
const E164 = /^\+[1-9]\d{7,14}$/;

// Returns the canonical form (Bangladeshi numbers always as +8801XXXXXXXXX), or null if invalid.
// Storing one form keeps uniqueness and login working whichever way the number is typed.
export const normalizePhone = (raw) => {
  const v = raw.replace(/[\s-]/g, '');
  const bd = v.match(BD_MOBILE);
  if (bd) return `+880${bd[1]}`;
  if (/^(\+?880|0)/.test(v)) return null; // looks Bangladeshi but isn't a valid mobile number
  return E164.test(v) ? v : null;
};

// Accepts 01834026012, +8801834026012, 8801834026012 (spaces/dashes allowed); outputs +8801834026012.
export const phoneSchema = z.string({ error: PHONE_MESSAGE }).transform((value, ctx) => {
  const phone = normalizePhone(value);
  if (!phone) {
    ctx.addIssue({ code: 'custom', message: PHONE_MESSAGE });
    return z.NEVER;
  }
  return phone;
});

// Avatars are only set by uploading an image (PUT /api/auth/me/avatar), never by sending a URL.
export const AVATAR_UPLOAD_ONLY = 'Avatar can only be set by uploading an image to PUT /api/auth/me/avatar';
export const noAvatarSchema = z.never({ error: AVATAR_UPLOAD_ONLY }).optional();

export const enumSchema = (values, field) => z.enum(values, { error: `${field} must be one of: ${values.join(', ')}` });

export const statusSchema = enumSchema(['active', 'suspended'], 'status');

// Lenient integer for query strings: missing or invalid -> default, then clamped to [min, max].
const clampedInt = (def, min, max) =>
  z.any().optional().transform((v) => {
    const n = Number.parseInt(v, 10);
    return Number.isNaN(n) ? def : Math.min(max, Math.max(min, n));
  });

export const paginationShape = {
  page: clampedInt(1, 1, Number.MAX_SAFE_INTEGER),
  limit: clampedInt(20, 1, 100),
  q: z
    .string()
    .optional()
    .transform((v) => (v && v.trim() ? v.trim().slice(0, 100) : undefined)),
};

// For PATCH bodies: at least one of the allowed fields must be present.
export const atLeastOne = (fields) => (obj) => fields.some((f) => obj[f] !== undefined);
