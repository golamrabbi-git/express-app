import { Router } from 'express';
import * as auth from '../controllers/auth.controller.js';
import { authenticate } from '../middlewares/auth.js';
import { authLimiter } from '../middlewares/rateLimit.js';
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

export default router;
