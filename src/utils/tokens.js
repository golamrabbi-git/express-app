import crypto from 'node:crypto';
import jwt from 'jsonwebtoken';
import config from '../config/index.js';

const ALGORITHM = 'HS256';

// `audience` separates user tokens ('user') from admin tokens ('admin'):
// a token issued for one is rejected by the other's verifier.

export const hashToken = (token) => crypto.createHash('sha256').update(token).digest('hex');

export const signAccessToken = (subject, { audience = 'user', expiresIn = config.jwt.accessExpiresIn } = {}) =>
  // Admin tokens carry their role; user tokens don't (users have no roles).
  jwt.sign({ email: subject.email, ...(subject.role && { role: subject.role }) }, config.jwt.accessSecret, {
    algorithm: ALGORITHM,
    subject: subject.id,
    audience,
    expiresIn,
  });

export const signRefreshToken = (subject, { audience = 'user', expiresIn = config.jwt.refreshExpiresIn } = {}) => {
  const jti = crypto.randomUUID();
  const token = jwt.sign({}, config.jwt.refreshSecret, {
    algorithm: ALGORITHM,
    subject: subject.id,
    audience,
    jwtid: jti,
    expiresIn,
  });
  const { exp } = jwt.decode(token);
  return { token, jti, expiresAt: exp * 1000 };
};

// Both verifiers throw jsonwebtoken errors (TokenExpiredError, JsonWebTokenError) on failure.
export const verifyAccessToken = (token, audience = 'user') =>
  jwt.verify(token, config.jwt.accessSecret, { algorithms: [ALGORITHM], audience });

export const verifyRefreshToken = (token, audience = 'user') =>
  jwt.verify(token, config.jwt.refreshSecret, { algorithms: [ALGORITHM], audience });
