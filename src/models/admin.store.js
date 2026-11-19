import mongoose from 'mongoose';
import Admin from './admin.model.js';
import AppError from '../utils/AppError.js';
import { effectivePermissions } from '../constants/permissions.js';
import { escapeRegex, paginate, toUpdate } from '../utils/query.js';

const toPlain = (doc) =>
  doc && {
    id: doc._id.toString(),
    name: doc.name,
    email: doc.email,
    phone: doc.phone ?? null,
    passwordHash: doc.passwordHash,
    role: doc.role,
    permissions: doc.permissions ?? [],
    status: doc.status,
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };

// Public shape: no password hash, and `permissions` is the effective list (all of them for the super admin).
export const toPublic = ({ passwordHash, ...admin }) => ({ ...admin, permissions: effectivePermissions(admin) });

const rethrowDuplicate = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0];
    if (field === 'role') throw new AppError(409, 'A super admin already exists');
    throw new AppError(409, `An admin with this ${field ?? 'value'} already exists`);
  }
  throw err;
};

export const findById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return toPlain(await Admin.findById(id).lean());
};

export const findByEmail = async (email) => toPlain(await Admin.findOne({ email }).lean());

export const findSuperAdmin = async () => toPlain(await Admin.findOne({ role: 'super_admin' }).lean());

export const create = async (fields) => {
  try {
    return toPlain(await Admin.create(fields));
  } catch (err) {
    return rethrowDuplicate(err);
  }
};

export const list = async ({ q, role, status, page, limit }) => {
  const filter = {};
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: re }, { email: re }, { phone: re }];
  }
  if (role) filter.role = role;
  if (status) filter.status = status;
  return paginate(Admin, filter, { page, limit }, (doc) => toPublic(toPlain(doc)));
};

export const update = async (id, fields) => {
  if (!mongoose.isValidObjectId(id)) return null;
  try {
    const doc = await Admin.findByIdAndUpdate(id, toUpdate(fields), { returnDocument: 'after', runValidators: true }).lean();
    return toPlain(doc);
  } catch (err) {
    return rethrowDuplicate(err);
  }
};

export const remove = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return toPlain(await Admin.findByIdAndDelete(id).lean());
};
