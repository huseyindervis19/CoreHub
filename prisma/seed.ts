import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

// =========================
// Translation Keys JSON
// =========================
const translationKeysJSON: Record<string, string> = {
  "error": "error",
  "create": "Create",
  "creating": "Creating...",
  "edit": "edit",
  "delete": "delete",
  "close": "Close",
  "update": "update",
  "updating": "Updating...",
  "loading": "Loading...",
  "action": "Action",
  "active": "active",
  "inactive": "inactive",
  "set_as_default": "Set as Default",
  "yes": "yes",
  "no": "No",
  "total": "Total",
  "created_successfully": "Created Successfully!",
  "updated_successfully": "Updated Successfully!",
  "delete_successfully": "Deleted Successfully!",
  "no_data_found": "No Data Found!",
  "update_failed": "An error occurred while updating.",
  "delete_failed": "An error occurred while deleting.",
  "loading_failed": "An error occurred while loading data.",
  "required_fields_error": "Please ensure all required fields are filled.",
  "confirm_delete": "Confirm Deletion",
  "delete_warning": "delete warning",
  "is_active": "Active",
  "is_featured": "Featured",

  "language": "language",
  "username": "name",
  "manage": "manage",
  "name": "name",
  "description": "description",

  "products_categories": "Products Categories",
  "add_product_categories": "Add Categories",
  "dashboard": "Dashboard",
  "products_list": "Products List",
  "add_product": "Add Product",
  "nav_menu": "Menu",
  "nav_others": "Others",
  "roles_permissions": "Roles && Permissions",
  "languages_list": "Languages",
  "languages_keys": "Language Keys",
  "languages": "Languages",
  "view_products": "view products",

  "email": "email",
  "email_placeholder": "info@gmail.com",
  "password": "password",
  "password_placeholder": "enter your password",
  "forgot_password": "Forgot your password?",
  "hide_password": "hide password",
  "sign_out": "Sign Out",
  "no_languages": "No languages",
  "edit_profile": "edit profile",
  "support": "support",

  "register_sentence": "Create Quotes Fast. Close Deals Faster.",
  "reset_password": "Reset Password",
  "signin_success": "Login successful, redirecting...",
  "signin_title": "Sign In",
  "signin_description": "Enter your email and password to sign in!",
  "signin_remember": "signin remember",
  "signin_button": "Sign In",
  "signin_error_invalid": "Invalid email or password",

  "product_count": "Product Count",
  "add_new_category": "Add New Category",
  "category_name": "Category Name",
  "category_name_placeholder": "Enter category name",
  "category_description": "Category Description",
  "category_description_placeholder": "enter category description",
  "category_image": "Category Image",
  "choose_file": "Choose File",
  "no_file_chosen": "no file chosen",
  "alt_text": "alt text",
  "alt_text_placeholder": "Enter alt text",
  "edit_product_category": "Edit Product Category",
  "current_image_set": "Current Image Set",

  "language_name": "Language Name",
  "language_name_placeholder": "enter language name (e.g. English, Arabic)",
  "language_code": "Language Code",
  "language_code_placeholder": "enter language code (e.g. en, ar)",
  "language_default": "Default Language",
  "add_language": "add language",
  "edit_language": "edit language",
  "translations": "Translations",
  "select_language_message": "Select a language to view translations.",

  "permissions": "Permissions",
  "permission_name": "Name",
  "permission_endpoint": "Endpoint",
  "permission_date": "Created At",

  "add_new_product": "Add New Product",
  "product_category_name": "Category Name",
  "product_category_name_placeholder": "Select Category",
  "product_name": "Product Name",
  "product_name_placeholder": "Enter product name",
  "product_description": "Product Description",
  "product_description_placeholder": "Enter product description",
  "product_stock_quantity": "Stock Quantity",
  "product_stock_quantity_placeholder": "Enter available stock",
  "product_main_image": "Main Image",
  "product_category_name_in_table": "Category",
  "stock_quantity_in_table": "Stock Quantity",
  "is_active_in_table": "Status",
  "name_required": "name required",
  "category_name_required": "Category name required",
  "stock_quantity_required": "stock quantity required",
  "edit_product": "edit product",

  "roles": "roles",
  "add_roles": "Add Roles",
  "role_name_placeholder": "Enter role name",
  "role_description_placeholder": "Enter role description",
  "edit_role": "Edit Role",
  "manage_permissions_for": "Manage Permissions for {role}",

  "user_not_found": "User not found",
  "profile": "Profile",
  "personal_info": "Personal Info",

  "users": "users",
  "select_at_least_one_role": "Please select at least one role.",
  "add_new_user": "Add User",
  "username_placeholder": "Enter username",
  "user_password": "password",
  "select_roles": "Select Roles",
  "select_language": "Select Language",
  "select_status": "Select Status",
  "edit_user": "Edit User",
  "no_results_found": "no results found",

  "show_password": "show password",
  "status": "status",
  "user": "user"
};

async function main() {
  console.log('Seeding database...');

  // ===================================================
  // LANGUAGES
  // ===================================================
  await prisma.language.createMany({
    data: [
      { code: 'en', name: 'English', isDefault: true },
      { code: 'fr', name: 'French', isDefault: false },
      { code: 'ar', name: 'العربية', isDefault: false },
    ],
    skipDuplicates: true,
  });

  // ===================================================
  // ROLES
  // ===================================================
  await prisma.role.createMany({
    data: [
      { name: 'developer', description: 'Developer with all access', isDeveloper: true },
      { name: 'admin', description: 'Administrator', isDeveloper: false },
      { name: 'manager', description: 'Manager', isDeveloper: false },
    ],
    skipDuplicates: true,
  });

  const roleRecords = await prisma.role.findMany();

  // ===================================================
  // PERMISSIONS
  // ===================================================
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

  // ===================================================
  // ROLE PERMISSIONS
  // ===================================================
  for (const role of roleRecords) {
    const data = permissionRecords.map((p) => ({
      roleId: role.id,
      permissionId: p.id,
    }));

    await prisma.rolePermission.createMany({
      data,
      skipDuplicates: true,
    });
  }

  // ===================================================
  // USERS
  // ===================================================
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

  // ===================================================
  // TRANSLATION KEYS 
  // ===================================================
  console.log("Adding translation keys from JSON...");

  const translationKeysArray = Object.entries(translationKeysJSON).map(([key, description]) => ({
    key,
    description,
  }));

  await prisma.translationKey.createMany({
    data: translationKeysArray,
    skipDuplicates: true,
  });

  const translationKeyRecords = await prisma.translationKey.findMany();
  const languages = await prisma.language.findMany();

  console.log("Creating translations...");

  for (const lang of languages) {
    for (const tkey of translationKeyRecords) {
      const exists = await prisma.translation.findFirst({
        where: { languageId: lang.id, translationKeyId: tkey.id },
      });

      if (!exists) {
        await prisma.translation.create({
          data: {
            languageId: lang.id,
            translationKeyId: tkey.id,
            value: translationKeysJSON[tkey.key] || tkey.key,
          },
        });
      }
    }
  }

  // ===================================================
  // Dynamic Translations
  // ===================================================
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
