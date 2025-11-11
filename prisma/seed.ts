import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('Seeding database...');

  await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fr', name: 'French', isDefault: false },
      { code: 'ar', name: 'العربية', isDefault: false },
    ],
    skipDuplicates: true,
  });

  await prisma.role.createMany({
    data: [
      { name: 'developer', description: 'Developer with all access', isDeveloper: true },
      { name: 'admin', description: 'Administrator', isDeveloper: false },
      { name: 'manager', description: 'Manager', isDeveloper: false },
    ],
    skipDuplicates: true,
  });

  const roleRecords = await prisma.role.findMany();

  await prisma.permission.createMany({
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
      { name: 'view_language_keys', endpoint: 'view/language-keys' },
      { name: 'edit_language_keys', endpoint: 'edit/language-keys' },
      { name: 'products', endpoint: '/products' },
      { name: 'product_create', endpoint: '/product/create' },
      { name: 'product_update', endpoint: '/product/update' },
      { name: 'product_delete', endpoint: '/product/delete' },
      { name: 'categories', endpoint: '/categories' },
      { name: 'category_create', endpoint: '/category/create' },
      { name: 'category_update', endpoint: '/category/update' },
      { name: 'category_delete', endpoint: '/category/delete' },
      { name: 'role_permissions', endpoint: '/role/permissions' },
    ],
    skipDuplicates: true,
  });

  const permissionRecords = await prisma.permission.findMany();

  for (const role of roleRecords) {
    const rolePerms = permissionRecords;

    const data = rolePerms.map((p) => ({
      roleId: role.id,
      permissionId: p.id,
    }));

    await prisma.rolePermission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  const passwordHash = await bcrypt.hash('123', 10);

  await prisma.user.createMany({
    data: [
      { username: 'dev', email: 'dev@gmail.com', password: passwordHash, status: 'active', languageId: 1 },
      { username: 'admin', email: 'admin@gmail.com', password: passwordHash, status: 'active', languageId: 1 },
      { username: 'manager', email: 'manager@gmail.com', password: passwordHash, status: 'active', languageId: 2 },
    ],
    skipDuplicates: true,
  });

  const userRecords = await prisma.user.findMany();

  const userRoleMapping = [
    { username: 'dev', roleName: 'developer' },
    { username: 'admin', roleName: 'admin' },
    { username: 'manager', roleName: 'manager' },
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

  const translationKeys = await prisma.translationKey.createMany({
    data: [
      { key: 'categories', description: 'Categories' },
      { key: 'products', description: 'Products' },
      { key: 'users', description: 'Users' },
      { key: 'create', description: 'Create' },
      { key: 'add', description: 'Add' },
      { key: 'save', description: 'Save' },
      { key: 'update', description: 'Update' },
      { key: 'edit', description: 'Edit' },
      { key: 'cancel', description: 'Cancel' },
      { key: 'close', description: 'Close' },
      { key: 'delete', description: 'Delete' },
      { key: 'remove', description: 'Remove' },
      { key: 'view', description: 'View' },
      { key: 'role_permissions', description: 'Role Permissions' },
    ],
    skipDuplicates: true,
  });

  const translationKeyRecords = await prisma.translationKey.findMany();

  for (const lang of await prisma.language.findMany()) {
    for (const tkey of translationKeyRecords) {
      await prisma.translation.create({
        data: {
          languageId: lang.id,
          translationKeyId: tkey.id,
          value: `${tkey.key}_${lang.code}`,
        },
      });
    }
  }

  await prisma.dynamicTranslation.createMany({
    data: [
      { tableName: 'Role', rowId: 1, field: 'name', languageId: 1, content: 'Administrator_EN' },
      { tableName: 'Role', rowId: 2, field: 'name', languageId: 2, content: 'Manager_FR' },
      { tableName: 'Role', rowId: 3, field: 'name', languageId: 3, content: 'Developer_AR' },
    ],
    skipDuplicates: true,
  });

  console.log('Seeding completed!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });