import AppError from './AppError.js';
import { hashToken, signAccessToken, signRefreshToken, verifyRefreshToken } from './tokens.js';

// Issues, rotates and revokes token pairs for one kind of account (users or admins).
export const createSessionManager = ({ audience, store, accessExpiresIn, refreshExpiresIn }) => {
  const issue = async (subject) => {
    const accessToken = signAccessToken(subject, { audience, expiresIn: accessExpiresIn });
    const { token: refreshToken, jti, expiresAt } = signRefreshToken(subject, {
      audience,
      expiresIn: refreshExpiresIn,
    });
    await store.save({ jti, tokenHash: hashToken(refreshToken), ownerId: subject.id, expiresAt });
    return { accessToken, refreshToken };
  };

  // Verifies a refresh token and consumes it (one use only). Returns the owner's id.
  const consume = async (refreshToken) => {
    let payload;
    try {
      payload = verifyRefreshToken(refreshToken, audience);
    } catch {
      throw new AppError(401, 'Invalid or expired refresh token');
    }

    const record = await store.find(payload.jti);
    if (!record || record.tokenHash !== hashToken(refreshToken)) {
      // Logged out, revoked (password change, suspension) or expired: just refuse it.
      throw new AppError(401, 'Refresh token has been revoked');
    }

    if (record.used || !(await store.markUsed(payload.jti))) {
      // The token was already exchanged once, so someone else may hold a copy:
      // treat it as theft and end every session for this owner.
      await store.removeAllForOwner(payload.sub);
      throw new AppError(401, 'Refresh token has been reused; all sessions were ended');
    }

    return payload.sub;
  };

  const revoke = async (refreshToken) => {
    try {
      const { jti } = verifyRefreshToken(refreshToken, audience);
      await store.remove(jti);
    } catch {
      // Invalid or expired token: nothing to revoke. Logout stays idempotent.
    }
  };

  const revokeAll = (ownerId) => store.removeAllForOwner(ownerId);

  return { issue, consume, revoke, revokeAll };
};
