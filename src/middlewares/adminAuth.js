import * as admins from '../models/admin.store.js';
import { hasPermissions } from '../constants/permissions.js';
import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Verifies an admin access token and loads the admin from the database on every request,
// so suspensions and permission changes take effect immediately.
export const authenticateAdmin = async (req, res, next) => {
  const [scheme, token] = (req.get('authorization') || '').split(' ');
  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Missing or malformed Authorization header'));
  }

  let payload;
  try {
    payload = verifyAccessToken(token, 'admin');
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return next(new AppError(401, message));
  }

  const admin = await admins.findById(payload.sub);
  if (!admin) return next(new AppError(401, 'Admin no longer exists'));
  if (admin.status !== 'active') return next(new AppError(403, 'Admin account is suspended'));

  req.admin = admins.toPublic(admin);
  return next();
};

// Requires every listed permission. The super admin passes every check.
export const requirePermission =
  (...required) =>
  (req, res, next) => {
    if (!req.admin) return next(new AppError(401, 'Not authenticated'));
    if (!hasPermissions(req.admin, required)) {
      return next(new AppError(403, `Missing permission: ${required.join(', ')}`));
    }
    return next();
  };
