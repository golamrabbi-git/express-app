import 'dotenv/config';

const env = process.env.NODE_ENV || 'development';

const resolveSecret = (name, devFallback) => {
  const value = process.env[name];
  if (value && value.length >= 32) return value;

  if (env === 'production') {
    throw new Error(`${name} must be set and at least 32 characters long in production`);
  }
  console.warn(`[config] ${name} is missing or shorter than 32 chars; using an insecure dev fallback`);
  return devFallback;
};

const DEFAULT_SUPER_ADMIN_PASSWORD = 'secret123';

const superAdmin = {
  name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
  email: (process.env.SUPER_ADMIN_EMAIL || 'superadmin@email.com').trim().toLowerCase(),
  phone: process.env.SUPER_ADMIN_PHONE || undefined, // optional
  password: process.env.SUPER_ADMIN_PASSWORD || DEFAULT_SUPER_ADMIN_PASSWORD,
};

if (env === 'production' && superAdmin.password === DEFAULT_SUPER_ADMIN_PASSWORD) {
  throw new Error('SUPER_ADMIN_PASSWORD must be changed from the default in production');
}

export default {
  port: process.env.PORT || 5050,
  env,
  mongoUri: process.env.MONGODB_URI,
  jwt: {
    accessSecret: resolveSecret('JWT_ACCESS_SECRET', 'dev-access-secret-change-me-0123456789abcdef'),
    refreshSecret: resolveSecret('JWT_REFRESH_SECRET', 'dev-refresh-secret-change-me-0123456789abcdef'),
    accessExpiresIn: process.env.JWT_ACCESS_EXPIRES_IN || '15m',
    refreshExpiresIn: process.env.JWT_REFRESH_EXPIRES_IN || '7d',
  },
  adminJwt: {
    accessExpiresIn: process.env.ADMIN_JWT_ACCESS_EXPIRES_IN || '10m',
    refreshExpiresIn: process.env.ADMIN_JWT_REFRESH_EXPIRES_IN || '1d',
  },
  superAdmin,
};
