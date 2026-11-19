import * as adminAuth from '../services/adminAuth.service.js';
import * as adminService from '../services/admin.service.js';
import { PERMISSIONS, ROLE_PERMISSIONS } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { clearRefreshCookie, refreshTokenFrom, sendTokens, wantsCookie } from '../utils/authCookie.js';

// Bodies and queries are already validated by the validate() middleware on each route
// (parsed query is on req.validatedQuery). Express 5 forwards rejected promises to the error handler.

// ---- Auth ----
// Token pairs go out through sendTokens: refresh token in an httpOnly cookie when the client
// sends `X-Auth-Mode: cookie` (admin panel), otherwise in the JSON body (Postman, scripts).
export const login = async (req, res) => sendTokens(req, res, await adminAuth.login(req.body));

export const refresh = async (req, res) => {
  const refreshToken = refreshTokenFrom(req);
  if (!refreshToken) throw new AppError(401, 'Refresh token missing');
  try {
    sendTokens(req, res, await adminAuth.refresh(refreshToken));
  } catch (err) {
    if (wantsCookie(req)) clearRefreshCookie(res); // don't keep a dead cookie around
    throw err;
  }
};

export const logout = async (req, res) => {
  const refreshToken = refreshTokenFrom(req);
  if (refreshToken) await adminAuth.logout(refreshToken);
  if (wantsCookie(req)) clearRefreshCookie(res);
  res.status(204).end();
};

export const me = (req, res) => res.json({ admin: req.admin });

export const changePassword = async (req, res) => {
  sendTokens(req, res, await adminAuth.changePassword(req.admin.id, req.body));
};

export const listPermissions = (_req, res) => {
  const { super_admin: _all, ...roles } = ROLE_PERMISSIONS;
  res.json({ permissions: PERMISSIONS, roles: { super_admin: 'all', ...roles } });
};

// ---- Admin management ----
export const listAdmins = async (req, res) => res.json(await adminService.listAdmins(req.validatedQuery));

export const getAdmin = async (req, res) => res.json({ admin: await adminService.getAdmin(req.params.id) });

export const createAdmin = async (req, res) => {
  res.status(201).json({ admin: await adminService.createAdmin(req.body) });
};

export const updateAdmin = async (req, res) => {
  res.json({ admin: await adminService.updateAdmin(req.admin, req.params.id, req.body) });
};

export const setPermissions = async (req, res) => {
  res.json({ admin: await adminService.setPermissions(req.params.id, req.body) });
};

export const deleteAdmin = async (req, res) => {
  await adminService.deleteAdmin(req.admin, req.params.id);
  res.status(204).end();
};

// ---- User management ----
export const listUsers = async (req, res) => res.json(await adminService.listUsers(req.validatedQuery));

export const getUser = async (req, res) => res.json({ user: await adminService.getUser(req.params.id) });

export const updateUser = async (req, res) => {
  res.json({ user: await adminService.updateUser(req.params.id, req.body) });
};

export const deleteUser = async (req, res) => {
  await adminService.deleteUser(req.params.id);
  res.status(204).end();
};

// ---- Files ----
export const uploadFile = async (req, res) => res.status(201).json({ file: await adminService.uploadFile(req.file) });

export const deleteFile = async (req, res) => {
  await adminService.deleteFile(req.body.key);
  res.status(204).end();
};
