import mongoose from 'mongoose';
import { PERMISSIONS, ROLES } from '../constants/permissions.js';

const adminSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    // Required. Admins log in with email.
    email: { type: String, required: true, unique: true, lowercase: true, trim: true },
    // Optional. Stored normalized (Bangladeshi numbers as +8801XXXXXXXXX). Unique when set (see index below).
    phone: { type: String, trim: true },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ROLES, required: true, default: 'admin' },
    // Unused for the super admin, who implicitly has every permission.
    permissions: [{ type: String, enum: PERMISSIONS }],
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

// Phone: unique only among admins that have one.
adminSchema.index(
  { phone: 1 },
  { name: 'phone_unique_when_set', unique: true, partialFilterExpression: { phone: { $type: 'string' } } },
);

// The database itself guarantees there is never more than one super admin.
adminSchema.index({ role: 1 }, { unique: true, partialFilterExpression: { role: 'super_admin' } });

export default mongoose.model('Admin', adminSchema);
