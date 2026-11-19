import * as authService from '../services/auth.service.js';

// Bodies are already validated by the validate() middleware on each route.
// Express 5 forwards rejected promises to the error handler, so no try/catch is needed here.

export const register = async (req, res) => {
  res.status(201).json(await authService.register(req.body));
};

export const login = async (req, res) => {
  res.json(await authService.login(req.body));
};

export const refresh = async (req, res) => {
  res.json(await authService.refresh(req.body.refreshToken));
};

export const logout = async (req, res) => {
  await authService.logout(req.body.refreshToken);
  res.status(204).end();
};

export const me = async (req, res) => {
  res.json({ user: await authService.getUserById(req.user.id) });
};

export const updateMe = async (req, res) => {
  res.json({ user: await authService.updateProfile(req.user.id, req.body) });
};

export const uploadAvatar = async (req, res) => {
  res.json({ user: await authService.setAvatar(req.user.id, req.file) });
};

export const deleteAvatar = async (req, res) => {
  res.json({ user: await authService.removeAvatar(req.user.id) });
};
