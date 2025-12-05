import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { Prisma, Role, RolePermission } from '@prisma/client';
import { wrapResponse, formatSingle, formatList, ApiResponse } from '../../common';

@Injectable()
export class RoleService {
  private readonly basePath = '/roles';

  constructor(private readonly prisma: PrismaService) { }
  // ---------------- CREATE ----------------
  async create(data: Prisma.RoleCreateInput): Promise<ApiResponse<Role>> {
    const role = await this.prisma.role.create({ data });
    return wrapResponse(formatSingle(role, this.basePath));
  }

  // ---------------- READ ALL ----------------
  async findAll(): Promise<ApiResponse<Omit<Role, 'isDeveloper'>[]>> {
    const roles = await this.prisma.role.findMany();
    const { data, meta, links } = formatList(roles, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ ONE ----------------
  async findOne(id: number): Promise<ApiResponse<Omit<Role, 'isDeveloper'>>> {
    const role = await this.prisma.role.findUnique({ where: { id } });
    if (!role) throw new NotFoundException(`Role with id ${id} not found`);
    return wrapResponse(formatSingle(role, this.basePath));
  }

  // ---------------- UPDATE ----------------
  async update(id: number, data: Prisma.RoleUpdateInput): Promise<ApiResponse<Omit<Role, 'isDeveloper'>>> {
    const role = await this.prisma.role.update({
      where: { id }, data
    });
    return wrapResponse(formatSingle(role, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number): Promise<ApiResponse<Role>> {
    const role = await this.prisma.role.delete({
      where: { id }
    });
    return wrapResponse(formatSingle(role, this.basePath));
  }

  // ---------------- GET ROLE PERMISSIONS ----------------
  async getRolePermissions(roleId: number): Promise<ApiResponse<RolePermission[]>> {
    const role = await this.prisma.role.findUnique({
      where: { id: roleId },
      include: { rolePermissions: true },
    });

    if (!role) throw new NotFoundException(`Role with id ${roleId} not found`);

    const items = role.rolePermissions.map(rp => ({
      id: rp.id,
      roleId: rp.roleId,
      permissionId: rp.permissionId,
      createdAt: rp.createdAt,
    }));

    const { data, meta, links } = formatList(items, `${this.basePath}/${roleId}/permissions`);
    return wrapResponse(data, meta, links);
  }

  // ---------------- UPDATE ROLE PERMISSIONS ----------------
  async updateRolePermissions(
    roleId: number,
    permissionIds: number[],
  ): Promise<ApiResponse<RolePermission[]>> {
    const roleExists = await this.prisma.role.findUnique({ where: { id: roleId } });
    if (!roleExists) throw new NotFoundException(`Role with id ${roleId} not found`);

    await this.prisma.rolePermission.deleteMany({ where: { roleId } });

    let newRolePermissions: RolePermission[] = [];
    if (permissionIds.length > 0) {
      const newPermissions = permissionIds.map(permissionId => ({ roleId, permissionId }));
      newRolePermissions = await this.prisma.rolePermission.createMany({
        data: newPermissions,
        skipDuplicates: true,
      }).then(() => this.prisma.rolePermission.findMany({ where: { roleId } }));
    }

    const { data, meta, links } = formatList(newRolePermissions, `${this.basePath}/${roleId}/permissions`);
    return wrapResponse(data, meta, links);
  }
}
