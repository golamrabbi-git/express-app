import mongoose from 'mongoose';
import User from './user.model.js';
import AppError from '../utils/AppError.js';
import { escapeRegex, paginate, toUpdate } from '../utils/query.js';

// Repository over MongoDB. Returns plain objects; never hands Mongoose documents to callers.
const toPlain = (doc) =>
  doc && {
    id: doc._id.toString(),
    name: doc.name,
    phone: doc.phone ?? null,
    email: doc.email ?? null,
    avatar: doc.avatar ?? null,
    passwordHash: doc.passwordHash,
    status: doc.status ?? 'active',
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
  };

// Strip private fields before sending a user to the client.
export const toPublic = ({ passwordHash, ...user }) => user;

const rethrowDuplicate = (err) => {
  if (err.code === 11000) {
    const field = Object.keys(err.keyValue ?? {})[0];
    throw new AppError(409, field === 'email' ? 'Email is already registered' : 'Phone number is already registered');
  }
  throw err;
};

export const findById = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return toPlain(await User.findById(id).lean());
};

export const findByPhone = async (phone) => toPlain(await User.findOne({ phone }).lean());

export const findByEmail = async (email) => toPlain(await User.findOne({ email }).lean());

export const create = async ({ name, phone, email, avatar, passwordHash }) => {
  try {
    return toPlain(await User.create({ name, phone, email, avatar, passwordHash }));
  } catch (err) {
    // Unique indexes catch duplicates, including two registrations racing each other.
    return rethrowDuplicate(err);
  }
};

export const list = async ({ q, status, page, limit }) => {
  const filter = {};
  if (q) {
    const re = new RegExp(escapeRegex(q), 'i');
    filter.$or = [{ name: re }, { phone: re }, { email: re }];
  }
  if (status) filter.status = status;
  return paginate(User, filter, { page, limit }, (doc) => toPublic(toPlain(doc)));
};

export const update = async (id, fields) => {
  if (!mongoose.isValidObjectId(id)) return null;
  try {
    const doc = await User.findByIdAndUpdate(id, toUpdate(fields), {
      returnDocument: 'after',
      runValidators: true,
    }).lean();
    return toPlain(doc);
  } catch (err) {
    return rethrowDuplicate(err);
  }
};

export const remove = async (id) => {
  if (!mongoose.isValidObjectId(id)) return null;
  return toPlain(await User.findByIdAndDelete(id).lean());
};
