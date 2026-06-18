import bcrypt from 'bcryptjs';
import { getDatabaseConnection } from './databaseManager';
import { originalDbName, SUPER_ADMIN } from '../constants';
import UserModel from '../models/user.model';
import RoleModel from '../models/role.model';
import { MODULES } from '../constants/modules';
import { ADMIN_ID, ADMIN_PASS, BCRYPT_SALT } from '../constants/env';

/**
 * Seeds the admin account and Super Admin role.
 *
 * - Creates the "Super Admin" role if it doesn't exist.
 * - Self-heals: always syncs permissions to include ALL modules,
 *   so newly added modules are automatically picked up.
 * - Creates the admin user if it doesn't exist (using ADMIN_ID / ADMIN_PASS env vars).
 * - Assigns the Super Admin role to the admin user if not already assigned.
 */
export async function seedAdmin(): Promise<void> {
  try {
    const connection = await getDatabaseConnection(
      originalDbName,
      process.env.ME_CONFIG_MONGODB_URL as string,
    );

    // Collect ALL permission values from the MODULES constant
    const allPermissions = Object.values(MODULES);

    // ── Super Admin Role ──────────────────────────────────────
    let superAdminRole = await RoleModel.findOne({ name: SUPER_ADMIN });

    if (!superAdminRole) {
      // We need a placeholder createdBy; will update once the admin user exists
      superAdminRole = await RoleModel.create({
        name: SUPER_ADMIN,
        description: 'Full access to all modules. Auto-managed by the system.',
        permissions: allPermissions,
        createdBy: '000000000000000000000000', // temp ObjectId placeholder
      });
      console.log(`[seed] Created "${SUPER_ADMIN}" role`);
    }

    // Self-heal: ensure every module permission is present
    const currentPerms = new Set(superAdminRole.permissions as string[]);
    const missing = allPermissions.filter((p) => !currentPerms.has(p));

    if (missing.length > 0) {
      superAdminRole.permissions = allPermissions;
      await superAdminRole.save();
      console.log(
        `[seed] Healed "${SUPER_ADMIN}" role — added ${missing.length} new permission(s): ${missing.join(', ')}`,
      );
    }

    // ── Admin User ────────────────────────────────────────────
    let adminUser = await UserModel.findOne({ studentID: ADMIN_ID });

    if (!adminUser) {
      const hashedPassword = await bcrypt.hash(
        ADMIN_PASS,
        parseInt(BCRYPT_SALT),
      );

      adminUser = await UserModel.create({
        studentID: ADMIN_ID,
        firstname: 'Admin',
        lastname: 'User',
        email: '',
        password: hashedPassword,
        role: 'admin',
        rbacRole: superAdminRole._id,
        roleManuallyAssigned: true,
        verified: true,
        profile: {
          url: 'https://res.cloudinary.com/diirvhsym/image/upload/v1728426644/user/zl85ljimxkrs1uqnqrvu.webp',
          publicID: 'user/al85leemxkrs2qwnqrvU',
        },
      });
      console.log(`[seed] Created admin user (ID: ${ADMIN_ID})`);
    }

    // Ensure the admin user has the Super Admin role assigned
    if (
      !adminUser.rbacRole ||
      adminUser.rbacRole.toString() !== superAdminRole._id?.toString()
    ) {
      adminUser.rbacRole = superAdminRole._id as any;
      adminUser.role = 'admin';
      await adminUser.save();
      console.log(`[seed] Assigned "${SUPER_ADMIN}" role to admin user`);
    }

    // Fix the placeholder createdBy on the role if it was just bootstrapped
    if (superAdminRole.createdBy?.toString() === '000000000000000000000000') {
      superAdminRole.createdBy = adminUser._id;
      await superAdminRole.save();
      console.log(
        `[seed] Updated "${SUPER_ADMIN}" role createdBy to admin user`,
      );
    }

    // ── Regular Default Role ───────────────────────────────────
    let regularRole = await RoleModel.findOne({ name: 'Regular' });
    if (!regularRole) {
      regularRole = await RoleModel.create({
        name: 'Regular',
        description:
          'Default role for newly registered students. Provides basic read access.',
        permissions: [
          MODULES.TRANSACTION_READ,
          MODULES.PRELISTING_READ,
          MODULES.CATEGORY_READ,
          MODULES.ORGANIZATION_READ,
        ],
        isDefault: true,
        createdBy: adminUser._id,
      });
      console.log(`[seed] Created "Regular" default role`);
    }

    console.log('[seed] Admin seeding complete ✓');
  } catch (err) {
    console.error('[seed] Failed to seed admin:', err);
  }
}
