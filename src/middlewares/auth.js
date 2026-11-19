import AppError from '../utils/AppError.js';
import { verifyAccessToken } from '../utils/tokens.js';

// Verifies a user access token. Admin routes use middlewares/adminAuth.js instead.
export const authenticate = (req, res, next) => {
  const header = req.get('authorization') || '';
  const [scheme, token] = header.split(' ');

  if (scheme !== 'Bearer' || !token) {
    return next(new AppError(401, 'Missing or malformed Authorization header'));
  }

  try {
    const payload = verifyAccessToken(token);
    req.user = { id: payload.sub, email: payload.email };
    return next();
  } catch (err) {
    const message = err.name === 'TokenExpiredError' ? 'Access token expired' : 'Invalid access token';
    return next(new AppError(401, message));
  }
};
