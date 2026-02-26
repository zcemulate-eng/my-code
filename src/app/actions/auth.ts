// src/app/actions/auth.ts
'use server';

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

// 请确保这里的地址和你后端的地址一致，如果在本地则是 http://localhost:3001/api/auth
const API_BASE_URL = 'http://localhost:3001/api/auth';

async function getAuthHeaders() {
    const cookieStore = await cookies();
    const userId = cookieStore.get('userId')?.value;
    return {
        'Content-Type': 'application/json',
        ...(userId ? { Cookie: `userId=${userId}` } : {})
    };
}

// 1. 注册
export async function registerUser(formData: any) {
    try {
        const res = await fetch(`${API_BASE_URL}/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        return await res.json();
    } catch (e) {
        return { success: false, message: "网络请求错误" };
    }
}

// 2. 登录 (调用后端验证，如果成功，在前端签发 Cookie)
export async function loginUser(formData: any) {
	try {
        const res = await fetch(`${API_BASE_URL}/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(formData),
        });
        const result = await res.json();

        if (result.success && result.userId) {
            const cookieStore = await cookies();
            cookieStore.set('userId', result.userId.toString(), {
                httpOnly: true,
                secure: process.env.NODE_ENV === 'production',
                path: '/',
                maxAge: 60 * 60 * 24 * 7 // 7天有效
            });
            return { success: true, message: "成功" };
        }
		return result;
	} catch (e) {
		return { success: false, message: "网络请求错误" };
	}
}

// 3. 获取当前用户信息
export async function getCurrentUser() {
    try {
        const res = await fetch(`${API_BASE_URL}/me`, {
            headers: await getAuthHeaders(),
            cache: 'no-store',
        });
        return await res.json();
    } catch (error) {
        return { success: false, data: null };
    }
}

// 4. 完成首次登录设置
export async function completeFirstLogin(data: { avatarUrl?: string | null, gender?: string }) {
    try {
        const res = await fetch(`${API_BASE_URL}/complete-first-login`, {
            method: 'POST',
            headers: await getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (error) {
        return { success: false, message: "网络请求错误" };
    }
}

// 5. 登出 (清除前端 Cookie 并重定向)
export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('userId'); 
    redirect('/login');
}

// 6. 更新账户资料
export async function updateAccount(data: any) {
    try {
        const res = await fetch(`${API_BASE_URL}/update-account`, {
            method: 'PUT',
            headers: await getAuthHeaders(),
            body: JSON.stringify(data),
        });
        return await res.json();
    } catch (error) {
        return { success: false, message: "网络请求错误" };
    }
}