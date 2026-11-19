import { rateLimit } from 'express-rate-limit';

const createLimiter = (limit) =>
  rateLimit({
    windowMs: 15 * 60 * 1000,
    limit,
    standardHeaders: 'draft-8',
    legacyHeaders: false,
    message: { error: 'Too many requests, please try again later' },
  });

// Separate counters, so user traffic can't lock admins out (or the other way round).
export const authLimiter = createLimiter(20);
export const adminAuthLimiter = createLimiter(10);
// Uploads are expensive (memory + storage), so cap them per IP too.
export const uploadLimiter = createLimiter(30);
