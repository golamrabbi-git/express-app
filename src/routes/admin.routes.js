import { Router } from 'express';
import * as admin from '../controllers/admin.controller.js';
import { authenticateAdmin, requirePermission as can } from '../middlewares/adminAuth.js';
import { adminAuthLimiter, uploadLimiter } from '../middlewares/rateLimit.js';
import { FILE_TYPES, uploadSingle } from '../middlewares/upload.js';
import { validate } from '../middlewares/validate.js';
import { adminLoginSchema, optionalRefreshTokenSchema } from '../validators/auth.validator.js';
import {
  adminListQuerySchema,
  changePasswordSchema,
  createAdminSchema,
  deleteFileSchema,
  permissionsSchema,
  updateAdminSchema,
  updateUserSchema,
  userListQuerySchema,
} from '../validators/admin.validator.js';

const router = Router();

// Auth (public)
router.post('/auth/login', adminAuthLimiter, validate({ body: adminLoginSchema }), admin.login);
// refreshToken comes from the body, or from the admin_rt cookie when X-Auth-Mode: cookie is sent.
router.post('/auth/refresh', adminAuthLimiter, validate({ body: optionalRefreshTokenSchema }), admin.refresh);
router.post('/auth/logout', validate({ body: optionalRefreshTokenSchema }), admin.logout);

// Everything below needs a valid admin token.
router.use(authenticateAdmin);

router.get('/auth/me', admin.me);
router.patch('/auth/me/password', validate({ body: changePasswordSchema }), admin.changePassword);
router.get('/permissions', admin.listPermissions);

router.get('/admins', can('admins:read'), validate({ query: adminListQuerySchema }), admin.listAdmins);
router.post('/admins', can('admins:create'), validate({ body: createAdminSchema }), admin.createAdmin);
router.get('/admins/:id', can('admins:read'), admin.getAdmin);
router.patch('/admins/:id', can('admins:update'), validate({ body: updateAdminSchema }), admin.updateAdmin);
router.patch('/admins/:id/permissions', can('permissions:manage'), validate({ body: permissionsSchema }), admin.setPermissions);
router.delete('/admins/:id', can('admins:delete'), admin.deleteAdmin);

router.get('/users', can('users:read'), validate({ query: userListQuerySchema }), admin.listUsers);
router.get('/users/:id', can('users:read'), admin.getUser);
router.patch('/users/:id', can('users:update'), validate({ body: updateUserSchema }), admin.updateUser);
router.delete('/users/:id', can('users:delete'), admin.deleteUser);

// multipart/form-data, field "file": JPG, PNG, WebP, GIF or PDF up to 10 MB
router.post('/files', can('files:upload'), uploadLimiter, uploadSingle('file', { maxMB: 10, types: FILE_TYPES }), admin.uploadFile);
router.delete('/files', can('files:delete'), validate({ body: deleteFileSchema }), admin.deleteFile);

export default router;
