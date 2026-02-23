// src/app/actions/user.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { getCurrentUser } from '@/app/actions/auth'; // 引入认证获取当前用户的方法

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
  password?: string;
}

// --- 1. 获取用户列表 (带分页、搜索、筛选) ---
export async function getUsers(filter: UserFilter) {
  try {
    // 基本的访问鉴权：确保是登录用户才能拉取列表
    const currentUserRes = await getCurrentUser();
    if (!currentUserRes.success || !currentUserRes.data) return { success: false, data: [], total: 0 };

    const { search, roles, page = 1, pageSize = 10 } = filter;
    const where: Prisma.UserWhereInput = {};

    if (search) {
      where.OR = [
        { name: { contains: search } }, 
        { email: { contains: search } },
      ];
    }

    if (roles && roles.length > 0) {
      where.role = { in: roles };
    }

    const total = await prisma.user.count({ where });
    const users = await prisma.user.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      skip: (page - 1) * pageSize,
      take: pageSize,
      select: { // 出于安全考虑，不要把用户密码返回给前端
          id: true, name: true, email: true, role: true, 
          status: true, phone: true, createdAt: true 
      }
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
    // 权限校验：获取当前操作者
    const currentUserRes = await getCurrentUser();
    if (!currentUserRes.success || !currentUserRes.data) return { success: false, error: "未登录" };
    const currentUser = currentUserRes.data;

    // 拦截：普通 User 绝无权限创建新用户
    if (currentUser.role === 'User') return { success: false, error: "越权操作：权限不足" };

    // 拦截：Manager 创建用户时，强制将其降级/锁定为 User 角色
    let assignedRole = data.role;
    if (currentUser.role === 'Manager') {
        assignedRole = 'User';
    }

    await prisma.user.create({
      data: {
        name: data.name,
        email: data.email,
        role: assignedRole, // 使用经过安全过滤的 Role
        status: data.status,
        password: data.password || '123456', 
      },
    });
    return { success: true };
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "用户创建失败，邮箱可能已被使用。" };
  }
}

// --- 3. 更新用户 ---
export async function updateUser(data: UpdateUserDTO) {
  try {
    // 权限校验：获取当前操作者
    const currentUserRes = await getCurrentUser();
    if (!currentUserRes.success || !currentUserRes.data) return { success: false, error: "未登录" };
    const currentUser = currentUserRes.data;

    // 拦截：普通 User 绝无权限在表格里更新其他用户
    if (currentUser.role === 'User') return { success: false, error: "越权操作：权限不足" };

    const { id, ...rest } = data;

    // 查出目标用户现在的真实身份
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return { success: false, error: "目标用户不存在" };

    // 拦截：Manager 只能编辑 User
    if (currentUser.role === 'Manager') {
        if (targetUser.role !== 'User') return { success: false, error: "越权操作：Manager只能编辑User" };
        // 强制抹除前端可能恶意传过来的 role 变更
        if (rest.role) delete rest.role; 
    }

    // 拦截：Admin 不能通过这个接口修改其他 Admin (保护机制)
    if (currentUser.role === 'Admin' && targetUser.role === 'Admin' && targetUser.id !== currentUser.id) {
        return { success: false, error: "操作拒绝：不可修改其他Admin的信息" };
    }

    await prisma.user.update({
      where: { id },
      data: rest,
    });
    return { success: true };
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "更新用户失败" };
  }
}

// --- 4. 删除单个用户 ---
export async function deleteUser(id: number) {
  try {
    // 权限校验：获取当前操作者
    const currentUserRes = await getCurrentUser();
    if (!currentUserRes.success || !currentUserRes.data) return { success: false, error: "未登录" };
    const currentUser = currentUserRes.data;

    // 拦截：普通 User 绝无权限删除
    if (currentUser.role === 'User') return { success: false, error: "越权操作：权限不足" };

    // 查出目标用户现在的真实身份
    const targetUser = await prisma.user.findUnique({ where: { id } });
    if (!targetUser) return { success: false, error: "目标用户不存在" };

    // 拦截：Manager 只能删除 User
    if (currentUser.role === 'Manager' && targetUser.role !== 'User') {
        return { success: false, error: "越权操作：Manager只能删除User" };
    }

    // 拦截：Admin 不能互相删除，也不能自杀
    if (currentUser.role === 'Admin' && targetUser.role === 'Admin') {
        return { success: false, error: "操作拒绝：不可删除Admin级别账号" };
    }

    await prisma.user.delete({ where: { id } });
    return { success: true };
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "删除用户失败" };
  }
}

// --- 5. 批量删除用户 (同样需要加上权限校验) ---
export async function deleteUsers(ids: number[]) {
    try {
        const currentUserRes = await getCurrentUser();
        if (!currentUserRes.success || !currentUserRes.data) return { success: false, error: "未登录" };
        const currentUser = currentUserRes.data;

        if (currentUser.role === 'User') return { success: false, error: "越权操作：权限不足" };

        // 查出所有目标用户的真实身份
        const targetUsers = await prisma.user.findMany({ where: { id: { in: ids } } });

        // 逐一校验权限
        for (const target of targetUsers) {
            if (currentUser.role === 'Manager' && target.role !== 'User') {
                return { success: false, error: "批量删除失败：选中了无权操作的层级" };
            }
            if (currentUser.role === 'Admin' && target.role === 'Admin') {
                return { success: false, error: "批量删除失败：包含了Admin级别账号" };
            }
        }

        await prisma.user.deleteMany({
            where: { id: { in: ids } },
        });
        return { success: true };
    } catch (error) {
        console.error("Bulk delete error:", error);
        return { success: false, error: "批量删除用户失败" };
    }
}

// --- 6. 获取现有角色列表 (保持不变) ---
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