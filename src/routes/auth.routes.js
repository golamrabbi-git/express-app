import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter, uploadLimiter } from '../middlewares/rateLimit.js';
import { IMAGE_TYPES, uploadSingle } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import {
  loginSchema,
  refreshTokenSchema,
  registerSchema,
  updateProfileSchema,
} from '../validators/auth.validator.js';

const router = Router();

router.post('/register', authLimiter, validate({ body: registerSchema }), auth.register);
router.post('/login', authLimiter, validate({ body: loginSchema }), auth.login);
router.post('/refresh', authLimiter, validate({ body: refreshTokenSchema }), auth.refresh);
router.post('/logout', validate({ body: refreshTokenSchema }), auth.logout);
router.get('/me', authenticate, auth.me);
router.patch('/me', authenticate, validate({ body: updateProfileSchema }), auth.updateMe);
// multipart/form-data, field "avatar": JPG, PNG or WebP up to 2 MB
router.put('/me/avatar', authenticate, uploadLimiter, uploadSingle('avatar', { maxMB: 2, types: IMAGE_TYPES }), auth.uploadAvatar);
router.delete('/me/avatar', authenticate, auth.deleteAvatar);

export default router;
