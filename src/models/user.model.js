import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 50 },
    // Required. Stored normalized (Bangladeshi numbers as +8801XXXXXXXXX). Users log in with phone or email.
    phone: { type: String, required: true, trim: true },
    // Optional. Unique when set (see index below).
    email: { type: String, lowercase: true, trim: true },
    // Optional http(s) URL of the profile picture.
    avatar: { type: String, trim: true, maxlength: 2048 },
    passwordHash: { type: String, required: true },
    // Suspended users cannot log in or refresh their session (set by admins).
    status: { type: String, enum: ['active', 'suspended'], default: 'active' },
  },
  { timestamps: true },
);

// Phone: unique. Kept as a partial index so users created before phone became required
// (who have none) don't block the index build.
userSchema.index({ phone: 1 }, { unique: true, partialFilterExpression: { phone: { $type: 'string' } } });

// Email: unique only among users that have one, so many users can leave it empty.
userSchema.index(
  { email: 1 },
  { name: 'email_unique_when_set', unique: true, partialFilterExpression: { email: { $type: 'string' } } },
);

export default mongoose.model('User', userSchema);
