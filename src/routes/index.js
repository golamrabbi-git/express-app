import { Router } from 'express';
import { getHealth } from '../controllers/health.controller.js';
import authRoutes from './auth.routes.js';
import adminRoutes from './admin.routes.js';
import { authenticate } from '../middlewares/auth.js';

const router = Router();

router.get('/health', getHealth);
router.use('/auth', authRoutes);
router.use('/admin', adminRoutes);

// Example protected route.
router.get('/protected', authenticate, (req, res) => {
  res.json({ message: 'You are authenticated', user: req.user });
});

export default router;
