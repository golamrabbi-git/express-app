import RefreshToken from './refreshToken.model.js';
import AdminRefreshToken from './adminRefreshToken.model.js';

// Refresh-token store over MongoDB, keyed by jti. Only a hash of each token is kept.
// `ownerField` is the document field holding the owner's id (userId / adminId).
const createTokenStore = (Model, ownerField) => ({
  save: async ({ jti, tokenHash, ownerId, expiresAt }) => {
    await Model.create({ jti, tokenHash, [ownerField]: ownerId, expiresAt: new Date(expiresAt) });
  },

  find: async (jti) => {
    // The TTL monitor runs about once a minute, so also filter out expired ones here.
    const record = await Model.findOne({ jti, expiresAt: { $gt: new Date() } }).lean();
    return record && { tokenHash: record.tokenHash, ownerId: record[ownerField].toString(), used: record.used };
  },

  // Atomically marks a token used. Returns false if it was already used (e.g. two refreshes racing).
  markUsed: async (jti) => {
    const res = await Model.updateOne({ jti, used: { $ne: true } }, { $set: { used: true } });
    return res.modifiedCount === 1;
  },

  remove: async (jti) => {
    await Model.deleteOne({ jti });
  },

  removeAllForOwner: async (ownerId) => {
    await Model.deleteMany({ [ownerField]: ownerId });
  },
});

export const userTokenStore = createTokenStore(RefreshToken, 'userId');
export const adminTokenStore = createTokenStore(AdminRefreshToken, 'adminId');
