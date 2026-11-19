import bcrypt from 'bcryptjs';
import config from '../config/index.js';
import * as admins from '../models/admin.store.js';
import { BCRYPT_COST } from './auth.service.js';

// Creates the one super admin on first start. Does nothing if one already exists,
// so changing SUPER_ADMIN_* in .env later does not overwrite the stored account.
export const ensureSuperAdmin = async () => {
  if (await admins.findSuperAdmin()) return;

  const { name, email, phone, password } = config.superAdmin;
  if (await admins.findByEmail(email)) {
    console.warn(`[seed] An admin with ${email} exists but is not super admin; super admin not created`);
    return;
  }

  try {
    await admins.create({
      name,
      email,
      phone,
      passwordHash: await bcrypt.hash(password, BCRYPT_COST),
      role: 'super_admin',
      permissions: [],
    });
    console.log(`[seed] Super admin created: ${email}`);
  } catch (err) {
    // Another instance created it at the same moment; the unique index kept it to one.
    if (err.status !== 409) throw err;
  }
};
