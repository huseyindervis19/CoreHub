import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  // ---------------- Languages ----------------
  const languages = await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fr', name: 'French', isDefault: false },
      { code: 'ar', name: 'العربية', isDefault: false },
    ],
    skipDuplicates: true,
  });

  // ---------------- Roles ----------------
  const roles = await prisma.role.createMany({
    data: [
      { name: 'admin', description: 'Administrator', isDeveloper: false },
      { name: 'manager', description: 'Manager', isDeveloper: false },
      { name: 'developer', description: 'Developer with all access', isDeveloper: true },
    ],
    skipDuplicates: true,
  });

  // Fetch roles to get their IDs
  const roleRecords = await prisma.role.findMany();

  // ---------------- Permissions ----------------
  const permissions = await prisma.permission.createMany({
    data: [
      { name: 'create_user', endpoint: '/users/create' },
      { name: 'update_user', endpoint: '/users/update' },
      { name: 'delete_user', endpoint: '/users/delete' },
      { name: 'view_users', endpoint: '/users' },
      { name: 'create_role', endpoint: '/roles/create' },
      { name: 'update_role', endpoint: '/roles/update' },
      { name: 'delete_role', endpoint: '/roles/delete' },
      { name: 'view_roles', endpoint: '/roles' },
      { name: 'create_language', endpoint: '/languages/create' },
      { name: 'update_language', endpoint: '/languages/update' },
      { name: 'delete_language', endpoint: '/languages/delete' },
      { name: 'view_languages', endpoint: '/languages' },
    ],
    skipDuplicates: true,
  });

  // Fetch permissions to get their IDs
  const permissionRecords = await prisma.permission.findMany();

  // ---------------- RolePermissions ----------------
  for (const role of roleRecords) {
    const rolePerms =
      role.isDeveloper
        ? permissionRecords // developer gets all permissions
        : permissionRecords.filter((p) => !p.name.startsWith('create_language')); // normal roles can't manage languages

    const data = rolePerms.map((p) => ({
      roleId: role.id,
      permissionId: p.id,
    }));

    await prisma.rolePermission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // ---------------- Users ----------------
  const passwordHash = await bcrypt.hash('123', 10);

  const users = await prisma.user.createMany({
    data: [
      { username: 'halim', email: 'halim@gmail.com', password: passwordHash, status: 'active', languageId: 1 },
      { username: 'admin', email: 'admin@gmail.com', password: passwordHash, status: 'active', languageId: 1 },
      { username: 'manager', email: 'manager@gmail.com', password: passwordHash, status: 'active', languageId: 2 },
      { username: 'dev', email: 'dev@gmail.com', password: passwordHash, status: 'active', languageId: 1 },
    ],
    skipDuplicates: true,
  });

  const userRecords = await prisma.user.findMany();

  // ---------------- UserRoles ----------------
  const userRoleMapping = [
    { username: 'halim', roleName: 'developer' },
    { username: 'admin', roleName: 'admin' },
    { username: 'manager', roleName: 'manager' },
    { username: 'dev', roleName: 'developer' },
  ];

  for (const mapping of userRoleMapping) {
    const user = userRecords.find((u) => u.username === mapping.username);
    const role = roleRecords.find((r) => r.name === mapping.roleName);

    if (user && role) {
      await prisma.userRole.create({
        data: { userId: user.id, roleId: role.id },
      });
    }
  }

  // ---------------- TranslationKeys ----------------
  const translationKeys = await prisma.translationKey.createMany({
    data: [
      { key: 'welcome', description: 'Welcome message' },
      { key: 'login', description: 'Login button text' },
      { key: 'logout', description: 'Logout button text' },
    ],
    skipDuplicates: true,
  });

  const translationKeyRecords = await prisma.translationKey.findMany();

  // ---------------- Translations ----------------
  for (const lang of await prisma.language.findMany()) {
    for (const tkey of translationKeyRecords) {
      await prisma.translation.create({
        data: {
          languageId: lang.id,
          translationKeyId: tkey.id,
          value: `${tkey.key}_${lang.code}`, // simple dummy translation
        },
      });
    }
  }

  // ---------------- DynamicTranslations ----------------
  await prisma.dynamicTranslation.createMany({
    data: [
      { tableName: 'Role', rowId: 1, field: 'name', languageId: 1, content: 'Administrator_EN' },
      { tableName: 'Role', rowId: 2, field: 'name', languageId: 2, content: 'Manager_FR' },
      { tableName: 'Role', rowId: 3, field: 'name', languageId: 3, content: 'Developer_AR' },
    ],
    skipDuplicates: true,
  });

  console.log('✅ Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
