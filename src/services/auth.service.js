import crypto from 'node:crypto';
import bcrypt from 'bcryptjs';
import * as storage from './storage.service.js';
import config from '../config/index.js';
import * as users from '../models/user.store.js';
import { userTokenStore } from '../models/token.store.js';
import AppError from '../utils/AppError.js';
import { createSessionManager } from '../utils/session.js';

export const BCRYPT_COST = 10;
// Compared against when the email is unknown, so timing doesn't reveal which emails exist.
export const DUMMY_HASH = bcrypt.hashSync('dummy-password-for-timing', BCRYPT_COST);

const sessions = createSessionManager({
  audience: 'user',
  store: userTokenStore,
  accessExpiresIn: config.jwt.accessExpiresIn,
  refreshExpiresIn: config.jwt.refreshExpiresIn,
});

// Used by admin user-management to end a suspended or deleted user's sessions.
export const revokeAllUserSessions = (userId) => sessions.revokeAll(userId);

export const register = async ({ name, phone, email, password, avatar }) => {
  if (await users.findByPhone(phone)) throw new AppError(409, 'Phone number is already registered');
  if (email && (await users.findByEmail(email))) throw new AppError(409, 'Email is already registered');
  const passwordHash = await bcrypt.hash(password, BCRYPT_COST);
  const user = await users.create({ name, phone, email, avatar, passwordHash });
  return { user: users.toPublic(user), ...(await sessions.issue(user)) };
};

// Log in with phone or email (the validator guarantees exactly one).
export const login = async ({ phone, email, password }) => {
  const user = phone ? await users.findByPhone(phone) : await users.findByEmail(email);
  const ok = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH);
  if (!user || !ok) {
    throw new AppError(401, 'Invalid credentials');
  }
  if (user.status === 'suspended') throw new AppError(403, 'Account is suspended');
  return { user: users.toPublic(user), ...(await sessions.issue(user)) };
};

export const refresh = async (refreshToken) => {
  const userId = await sessions.consume(refreshToken);
  const user = await users.findById(userId);
  if (!user) throw new AppError(401, 'Invalid or expired refresh token');
  if (user.status === 'suspended') throw new AppError(403, 'Account is suspended');
  return sessions.issue(user);
};

export const logout = (refreshToken) => sessions.revoke(refreshToken);

export const updateProfile = async (id, fields) => {
  const before = await users.findById(id);
  if (!before) throw new AppError(401, 'User no longer exists');
  const user = await users.update(id, fields);
  // Avatar replaced or removed: delete the old file if we stored it.
  if (fields.avatar !== undefined && before.avatar !== user.avatar) await storage.deleteFileByUrl(before.avatar);
  return users.toPublic(user);
};

const AVATAR_CACHE = 'public, max-age=31536000, immutable'; // each upload gets a new key, so cache forever

export const setAvatar = async (id, file) => {
  const before = await users.findById(id);
  if (!before) throw new AppError(401, 'User no longer exists');
  const { url } = await storage.uploadFile({
    key: `avatars/${id}/${crypto.randomUUID()}.${file.extension}`,
    body: file.buffer,
    contentType: file.detectedType,
    cacheControl: AVATAR_CACHE,
  });
  const user = await users.update(id, { avatar: url });
  await storage.deleteFileByUrl(before.avatar);
  return users.toPublic(user);
};

export const removeAvatar = async (id) => updateProfile(id, { avatar: null });

export const getUserById = async (id) => {
  const user = await users.findById(id);
  if (!user) throw new AppError(401, 'User no longer exists');
  return users.toPublic(user);
};
