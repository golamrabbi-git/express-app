import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as storage from './storage.service.js';
import * as admins from '../models/admin.store.js';
import * as users from '../models/user.store.js';
import { ROLE_PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { adminSessions } from './adminAuth.service.js';
import { BCRYPT_COST, revokeAllUserSessions } from './auth.service.js';

const notFound = (what) => new AppError(404, `${what} not found`);

const loadAdmin = async (id) => {
  const admin = await admins.findById(id);
  if (!admin) throw notFound('Admin');
  return admin;
};

// ---- Admin management ----

export const listAdmins = (query) => admins.list(query);

export const getAdmin = async (id) => admins.toPublic(await loadAdmin(id));

export const createAdmin = async ({ name, email, phone, password, role, permissions }) => {
  if (await admins.findByEmail(email)) throw new AppError(409, 'An admin with this email already exists');
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const admin = await admins.create({
    name,
    email,
    phone,
    passwordHash,
    role,
    permissions: permissions ?? ROLE_PERMISSIONS[role],
  });
  return admins.toPublic(admin);
};

export const updateAdmin = async (actor, id, fields) => {
  const target = await loadAdmin(id);

  if (target.role === 'super_admin' && (fields.role !== undefined || fields.status !== undefined)) {
    throw new AppError(403, "The super admin's role and status cannot be changed");
  }
  if (actor.id === target.id && fields.status === 'suspended') {
    throw new AppError(400, 'You cannot suspend yourself');
  }

  const changes = { ...fields };
  // A role change resets permissions to that role's defaults.
  if (fields.role !== undefined && fields.role !== target.role) {
    changes.permissions = ROLE_PERMISSIONS[fields.role];
  }

  const updated = await admins.update(id, changes);
  if (fields.status === 'suspended') await adminSessions.revokeAll(id);
  return admins.toPublic(updated);
};

export const setPermissions = async (id, { permissions }) => {
  const target = await loadAdmin(id);
  if (target.role === 'super_admin') {
    throw new AppError(400, 'The super admin always has every permission');
  }
  return admins.toPublic(await admins.update(id, { permissions }));
};

export const deleteAdmin = async (actor, id) => {
  const target = await loadAdmin(id);
  if (target.role === 'super_admin') throw new AppError(403, 'The super admin cannot be deleted');
  if (actor.id === target.id) throw new AppError(400, 'You cannot delete yourself');
  await admins.remove(id);
  await adminSessions.revokeAll(id);
};

// ---- User management ----

export const listUsers = (query) => users.list(query);

export const getUser = async (id) => {
  const user = await users.findById(id);
  if (!user) throw notFound('User');
  return users.toPublic(user);
};

export const updateUser = async (id, fields) => {
  const before = await users.findById(id);
  if (!before) throw notFound('User');
  const user = await users.update(id, fields);
  if (fields.status === 'suspended') await revokeAllUserSessions(id);
  if (fields.avatar !== undefined && before.avatar !== user.avatar) await storage.deleteFileByUrl(before.avatar);
  return users.toPublic(user);
};

export const deleteUser = async (id) => {
  const user = await users.remove(id);
  if (!user) throw notFound('User');
  await revokeAllUserSessions(id);
  await storage.deleteFileByUrl(user.avatar);
};

// ---- Files (product images, documents, ...) ----

export const uploadFile = async (file) => {
  const now = new Date();
  const month = String(now.getUTCMonth() + 1).padStart(2, '0');
  const { key, url } = await storage.uploadFile({
    key: `files/${now.getUTCFullYear()}/${month}/${crypto.randomUUID()}.${file.extension}`,
    body: file.buffer,
    contentType: file.detectedType,
    cacheControl: 'public, max-age=31536000, immutable',
  });
  return { key, url, contentType: file.detectedType, size: file.size, originalName: file.originalname };
};

export const deleteFile = (key) => storage.deleteFile(key);
