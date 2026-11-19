import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import * as admins from '../models/admin.store.js';
import { adminTokenStore } from '../models/token.store.js';
import AppError from '../utils/AppError.js';
import { createSessionManager } from '../utils/session.js';
import { BCRYPT_COST, DUMMY_HASH } from './auth.service.js';

export const adminSessions = createSessionManager({
  audience: 'admin',
  store: adminTokenStore,
  accessExpiresIn: config.adminJwt.accessExpiresIn,
  refreshExpiresIn: config.adminJwt.refreshExpiresIn,
});

const assertActive = (admin) => {
  if (admin.status !== 'active') throw new AppError(403, 'Admin account is suspended');
};

export const login = async ({ email, password }) => {
  const admin = await admins.findByEmail(email);
  const ok = await bcrypt.compare(password, admin?.passwordHash ?? DUMMY_HASH);
  if (!admin || !ok) throw new AppError(401, 'Invalid email or password');
  assertActive(admin);
  return { admin: admins.toPublic(admin), ...(await adminSessions.issue(admin)) };
};

export const refresh = async (refreshToken) => {
  const adminId = await adminSessions.consume(refreshToken);
  const admin = await admins.findById(adminId);
  if (!admin) throw new AppError(401, 'Invalid or expired refresh token');
  assertActive(admin);
  return adminSessions.issue(admin);
};

export const logout = (refreshToken) => adminSessions.revoke(refreshToken);

// Changing the password ends every other session and returns a fresh token pair for this one.
export const changePassword = async (adminId, { currentPassword, newPassword }) => {
  const admin = await admins.findById(adminId);
  if (!admin) throw new AppError(401, 'Admin no longer exists');
  if (!(await bcrypt.compare(currentPassword, admin.passwordHash))) {
    throw new AppError(400, 'Validation failed', [{ field: 'currentPassword', message: 'Current password is incorrect' }]);
  }
  const passwordHash = await bcrypt.hash(newPassword, BCRYPT_COST);
  const updated = await admins.update(adminId, { passwordHash });
  await adminSessions.revokeAll(adminId);
  return adminSessions.issue(updated);
};
