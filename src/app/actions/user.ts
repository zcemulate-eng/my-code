'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

// --- 类型定义 ---
export interface UserFilter {
  search?: string;
  roles?: string[];
  page?: number;
  pageSize?: number;
}

export interface CreateUserDTO {
  name: string;
  email: string;
  role: string;
  status: string;
  password?: string;
}

export interface UpdateUserDTO {
  id: number;
  name?: string;
  email?: string;
  role?: string;
  status?: string;
}

// --- 1. 获取用户列表 (带分页、搜索、筛选) ---
export async function getUsers(filter: UserFilter) {
  try {
    const { search, roles, page = 1, pageSize = 10 } = filter;
    const where: Prisma.UserWhereInput = {};

    // 搜索逻辑：匹配 姓名 OR 邮箱
    if (search) {
      where.OR = [
        { name: { contains: search } }, 
        { email: { contains: search } },
      ];
    }

    // 角色筛选逻辑
    if (roles && roles.length > 0) {
      where.role = { in: roles };
    }

    // 查询总数 (用于前端分页)
    const total = await prisma.user.count({ where });

    // 查询数据
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' }, // 新用户排前面
      skip: (page - 1) * pageSize,
      take: pageSize,
    });

    return { success: true, data: users, total };
  } catch (error) {
    console.error("Fetch users error:", error);
    return { success: false, data: [], total: 0 };
  }
}

// --- 2. 创建用户 ---
export async function createUser(data: CreateUserDTO) {
  try {
    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
        status: data.status,
        password: data.password || '123456', // 默认密码
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "User create failed. Email might already exist." };
  }
}

// --- 3. 更新用户 ---
export async function updateUser(data: UpdateUserDTO) {
  try {
    const { id, ...rest } = data;
    await prisma.user.update({
      where: { id },
      data: rest,
    });
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "Failed to update user." };
  }
}

// --- 4. 删除单个用户 ---
export async function deleteUser(id: number) {
  try {
    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "Failed to delete user." };
  }
}

// --- 5. 批量删除用户 ---
export async function deleteUsers(ids: number[]) {
  try {
    await prisma.user.deleteMany({
      where: { id: { in: ids } },
    });
    return { success: true };
  } catch (error) {
    console.error("Bulk delete error:", error);
    return { success: false, error: "Failed to delete users." };
  }
}

// --- 6. 获取现有角色列表 (用于筛选器) ---
export async function getUserRoles() {
  try {
    const groups = await prisma.user.groupBy({
      by: ['role'],
      orderBy: { role: 'asc' }
    });
    return groups.map(g => g.role);
  } catch (error) {
    return [];
  }
}