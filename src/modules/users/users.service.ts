import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UserRoleService } from '../user-roles/user-roles.service';
import { User } from '@prisma/client';
import { wrapResponse, formatSingle, formatList, ApiResponse } from '../../common';
import { CreateUserDto } from './dto/create-user.dto';
import { UpdateUserDto } from './dto/update-user.dto';
import * as bcrypt from 'bcryptjs';

type UserResponse = Omit<User, 'password'>;

@Injectable()
export class UserService {
  private readonly basePath = '/users';

  constructor(private readonly prisma: PrismaService,
    private readonly userRoleService: UserRoleService,
  ) { }

  // ---------------- CREATE ----------------
  async create(data: CreateUserDto): Promise<ApiResponse<UserResponse>> {
    if (data.password) {
      const salt = await bcrypt.genSalt(10);
      data.password = await bcrypt.hash(data.password, salt);
    }

    const user = await this.prisma.user.create({
      data: {
        username: data.username,
        email: data.email,
        password: data.password,
        status: data.status ?? 'active',
        languageId: data.languageId,
      },
    });

    // Create userRoles if roleIds provided
    if (data.roleIds && data.roleIds.length > 0) {
      await Promise.all(
        data.roleIds.map(roleId =>
          this.userRoleService.create({ userId: user.id, roleId })
        )
      );
    }

    const { password, ...userWithoutPassword } = user;
    return wrapResponse(formatSingle(userWithoutPassword, this.basePath));
  }

  // ---------------- READ ALL ----------------
  async findAll(): Promise<ApiResponse<any[]>> {
    const users = await this.prisma.user.findMany({
      include: {
        userRoles: {
          include: {
            role: true,
          },
        },
        language: true,
      },
    });


    const sanitizedUsers = users.map(user => {
      const { password, ...restUser } = user;
      return {
        ...restUser,
        userRoles: user.userRoles.map(ur => ({
          ...ur,
          role: ur.role,
        })),
      };
    });

    const { data, meta, links } = formatList(sanitizedUsers, this.basePath);
    return wrapResponse(data, meta, links);
  }

  // ---------------- READ ONE ----------------
  async findOne(id: number): Promise<ApiResponse<User>> {
    const user = await this.prisma.user.findUnique({
      where: { id },
      include: { userRoles: { include: { role: true } }, language: true },
    });
    if (!user) throw new NotFoundException(`User with id ${id} not found`);
    return wrapResponse(formatSingle(user, this.basePath));
  }

  // ---------------- UPDATE ----------------
  async update(id: number, data: UpdateUserDto): Promise<ApiResponse<UserResponse>> {
    const { roleIds, password, ...userData } = data;
    const user = await this.prisma.user.update({
      where: { id },
      data: userData,
    });

    if (roleIds && roleIds.length > 0) {
      const existingRoles = await this.prisma.userRole.findMany({ where: { userId: id } });

      await Promise.all(existingRoles.map(r => this.userRoleService.remove(r.id)));

      await Promise.all(
        roleIds.map(roleId => this.userRoleService.create({ userId: id, roleId }))
      );
    }

    const { password: _pw, ...userWithoutPassword } = user;
    return wrapResponse(formatSingle(userWithoutPassword, this.basePath));
  }

  // ---------------- DELETE ----------------
  async remove(id: number): Promise<ApiResponse<User>> {
    const user = await this.prisma.user.delete({
      where: { id },
    });
    return wrapResponse(formatSingle(user, this.basePath));
  }
}
