# express-app

Basic Express.js API starter.

## Setup

```bash
yarn install
cp .env.example .env
yarn dev        # development with auto-reload (nodemon)
yarn start      # production
```

## Endpoints

- `GET /` — welcome message
- `GET /api/health` — health check

### Auth (`/api/auth`)

| Method & path | Auth | Body | Success |
| --- | --- | --- | --- |
| `POST /register` | — | `{ name, phone, password, email? }` | 201 `{ user, accessToken, refreshToken }` |
| `POST /login` | — | `{ phone, password }` or `{ email, password }` | 200 `{ user, accessToken, refreshToken }` |
| `POST /refresh` | — | `{ refreshToken }` | 200 `{ accessToken, refreshToken }` (old token is revoked) |
| `POST /logout` | — | `{ refreshToken }` | 204 |
| `GET /me` | Bearer | — | 200 `{ user }` |
| `PATCH /me` | Bearer | any of `{ name, phone, email }` (`null` removes email) | 200 `{ user }` |
| `PUT /me/avatar` | Bearer | multipart/form-data, file in `avatar` (JPG/PNG/WebP, max 2 MB) | 200 `{ user }` |
| `DELETE /me/avatar` | Bearer | — | 200 `{ user }` (avatar `null`, file deleted) |
| `GET /api/protected` | Bearer | — | 200 example protected route |

A user is `{ id, name, phone, email, avatar, status, createdAt, updatedAt }`. `phone` is **required and unique**. Bangladeshi numbers can be sent as `01712345678` or `+8801712345678` (spaces and dashes are ignored) and are always stored and returned as `+8801712345678`; other countries use `+` international format; `email` (unique when set) is optional. `avatar` is `null` until the user uploads an image with `PUT /me/avatar` — it can't be set to a URL.

Send the access token as `Authorization: Bearer <accessToken>`. Access tokens last 15 minutes and refresh tokens 7 days (set these in `.env`).
Users and refresh tokens are stored in MongoDB (`users` and `refreshtokens` collections). Set `MONGODB_URI` in `.env`; the server won't start without a database connection. Expired refresh tokens are removed automatically by a TTL index.

### Admin (`/api/admin`)

Admins live in their own `admins` collection, with their own tokens. Admins log in with **email** (required, unique); `phone` is optional (unique when set). Admin tokens only work on `/api/admin`, and user tokens never work there.
On first start the server creates **one super admin** from `SUPER_ADMIN_*` in `.env` (default `superadmin@email.com` / `secret123`; change it before production, where the default is refused).

| Method & path | Permission |
| --- | --- |
| `POST /auth/login`, `POST /auth/refresh`, `POST /auth/logout` | — |
| `GET /auth/me`, `PATCH /auth/me/password`, `GET /permissions` | any admin |
| `GET /admins`, `GET /admins/:id` | `admins:read` |
| `POST /admins` | `admins:create` |
| `PATCH /admins/:id` (name, phone, role, status; `null` removes phone) | `admins:update` |
| `PATCH /admins/:id/permissions` | `permissions:manage` |
| `DELETE /admins/:id` | `admins:delete` |
| `GET /users`, `GET /users/:id` | `users:read` |
| `PATCH /users/:id` (name, phone, email, status; `avatar: null` removes the avatar) | `users:update` |
| `DELETE /users/:id` | `users:delete` |
| `POST /files` (multipart, file in `file`: JPG/PNG/WebP/GIF/PDF, max 10 MB) | `files:upload` |
| `DELETE /files` `{ key }` | `files:delete` |

Roles: `super_admin` (every permission, can't be suspended, demoted or deleted), `admin`, `support`. Role defaults are in `src/constants/permissions.js`; the super admin can grant or revoke single permissions per admin.

### File storage (Cloudflare R2)

Avatars and admin uploads are stored in R2 (S3-compatible) using the `R2_*` settings in `.env`, and served from `R2_PUBLIC_URL`.

- Avatars: `avatars/<userId>/<uuid>.<ext>`; uploaded files: `files/<yyyy>/<mm>/<uuid>.<ext>`. Original file names are never used in keys.
- The type is detected from the file's bytes, not its name or the browser's claim; SVG is never accepted.
- Replacing or removing an avatar, or deleting a user, deletes the old file.
- Without `R2_*` settings the upload endpoints return 503.

Protect your own routes with the middleware:

```js
import { authenticate } from './middlewares/auth.js';                         // users
import { authenticateAdmin, requirePermission } from './middlewares/adminAuth.js'; // admins
router.get('/orders', authenticate, handler);
router.post('/admin/products', authenticateAdmin, requirePermission('products:create'), handler);
```

## Structure

```
src/
  app.js          # Express app & middleware
  server.js       # entry point
  config/         # env config (JWT settings) + MongoDB connection
  routes/         # route definitions
  controllers/    # request handlers
  services/       # business logic (auth, admin, storage/R2)
  models/         # Mongoose models (users, admins, refresh tokens) + repositories
  constants/      # admin roles and permissions
  validators/     # Zod schemas (applied by middlewares/validate.js)
  middlewares/    # auth, rate limit, 404 + error handler
  utils/          # AppError, JWT helpers
```
