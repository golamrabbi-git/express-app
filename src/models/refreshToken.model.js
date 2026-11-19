import mongoose from 'mongoose';

const refreshTokenSchema = new mongoose.Schema({
  jti: { type: String, required: true, unique: true },
  tokenHash: { type: String, required: true },
  // Set when the token is exchanged. Kept (until it expires) so reuse can be detected.
  used: { type: Boolean, default: false },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
  // TTL index: MongoDB deletes the document once expiresAt has passed.
  expiresAt: { type: Date, required: true, expires: 0 },
});

export default mongoose.model('RefreshToken', refreshTokenSchema);
