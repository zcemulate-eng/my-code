// src/app/actions/user.ts
'use server';

import { cookies } from 'next/headers';

// --- 类型定义 (保持不变，避免前端页面报错) ---
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

// 目标 Nest.js 后端地址
const API_BASE_URL = 'http://localhost:3001/api/users';

// 辅助方法：自动抓取 Next.js 的 Cookie 并附带在请求头中发送给 Nest.js
async function getAuthHeaders() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  
  return {
    'Content-Type': 'application/json',
    // 如果有登录态，手动把 Cookie 塞进请求头转发过去
    ...(userId ? { Cookie: `userId=${userId}` } : {})
  };
}

// --- 1. 获取用户列表 (联调 Nest.js GET /api/users) ---
export async function getUsers(filter: UserFilter) {
  try {
    const query = new URLSearchParams();
    if (filter.search) query.append('search', filter.search);
    if (filter.roles && filter.roles.length > 0) query.append('roles', filter.roles.join(','));
    if (filter.page) query.append('page', filter.page.toString());
    if (filter.pageSize) query.append('pageSize', filter.pageSize.toString());

    const res = await fetch(`${API_BASE_URL}?${query.toString()}`, {
      headers: await getAuthHeaders(),
      cache: 'no-store', // 禁用 Next.js 的缓存，保证数据实时性
    });
    
    return await res.json();
  } catch (error) {
    console.error("Fetch users error:", error);
    return { success: false, data: [], total: 0 };
  }
}

// --- 2. 创建用户 (联调 Nest.js POST /api/users) ---
export async function createUser(data: CreateUserDTO) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    console.error("Create user error:", error);
    return { success: false, error: "网络请求错误" };
  }
}

// --- 3. 更新用户 (联调 Nest.js PUT /api/users/:id) ---
export async function updateUser(data: UpdateUserDTO) {
  try {
    const { id, ...rest } = data;
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(rest),
    });
    return await res.json();
  } catch (error) {
    console.error("Update user error:", error);
    return { success: false, error: "网络请求错误" };
  }
}

// --- 4. 删除单个用户 (联调 Nest.js DELETE /api/users/:id) ---
export async function deleteUser(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return await res.json();
  } catch (error) {
    console.error("Delete user error:", error);
    return { success: false, error: "网络请求错误" };
  }
}

// --- 5. 批量删除用户 (未实现完整Nest.js接口，先保留空壳或补充API) ---
export async function deleteUsers(ids: number[]) {
    // 💡 提示：这里可以在 Nest.js 补充一个 POST /api/users/bulk-delete 接口
    return { success: false, error: "前后端分离后批量删除接口待实现" };
}

// --- 6. 获取现有角色列表 (联调 Nest.js GET /api/users/roles) ---
export async function getUserRoles() {
  try {
    const res = await fetch(`${API_BASE_URL}/roles`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    const data = await res.json();
    return Array.isArray(data) ? data : [];
  } catch (error) {
    console.error("Fetch roles error:", error);
    return [];
  }
}