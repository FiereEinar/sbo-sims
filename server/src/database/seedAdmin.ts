import bcrypt from 'bcryptjs';
import { getDatabaseConnection } from './databaseManager';
import UserModel from '../models/user.model';
import RoleModel from '../models/role.model';
import { MODULES } from '../constants/modules';
import {
  ADMIN_ID,
  ADMIN_PASS,
  BCRYPT_SALT,
  DATABASE_NAME,
} from '../constants/env';

/**
 * Seeds the central admin account.
 *
 * - Creates the central admin user if it doesn't exist (using ADMIN_ID / ADMIN_PASS env vars).
 */
export async function seedAdmin(): Promise<void> {
  try {
    const connection = await getDatabaseConnection(
      DATABASE_NAME,
      process.env.ME_CONFIG_MONGODB_URL as string,
    );

    // ── Central Admin User ────────────────────────────────────────────
    let adminUser = await UserModel.findOne({ studentID: ADMIN_ID });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(
        ADMIN_PASS,
        parseInt(BCRYPT_SALT),
      );

      adminUser = await UserModel.create({
        studentID: ADMIN_ID,
        firstname: 'Central',
        lastname: 'Admin',
        email: '',
        password: hashedPassword,
        role: 'central-admin',
        roleManuallyAssigned: true,
        verified: true,
        profile: {
          url: 'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp',
          publicID: 'user/al85leemxkrs2qwnqrvU',
        },
      });
      console.log(`[seed] Created central admin user (ID: ${ADMIN_ID})`);
    } else if (adminUser.role !== 'central-admin') {
      // Self-heal the central admin role if it's currently 'admin' or something else
      adminUser.role = 'central-admin';
      await adminUser.save();
      console.log(`[seed] Healed central admin user role`);
    }

    console.log('[seed] Admin seeding complete ✓');
  } catch (err) {
    console.error('[seed] Failed to seed admin:', err);
  }
}
