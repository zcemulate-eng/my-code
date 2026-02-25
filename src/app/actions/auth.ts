// src/app/actions/auth.ts
'use server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function registerUser(formData: any) {
    try {
        // 1. 检查邮箱是否已被注册
        const existingEmail = await prisma.user.findUnique({ 
            where: { email: formData.email } 
        });
        if (existingEmail) {
            return { success: false, message: "该邮箱已被注册" };
        }

        // 👉 2. 新增：检查昵称是否已被注册
        if (formData.username) {
            const existingName = await prisma.user.findFirst({
                where: { name: formData.username }
            });
            if (existingName) {
                return { success: false, message: "该昵称已被人使用" };
            }
        }

        // 3. 将表单数据写入数据库
        await prisma.user.create({ 
            data: { 
                email: formData.email, 
                password: formData.password,
                name: formData.username,      // 映射前端的 username 到数据库的 name
                phone: formData.phone,        
                dob: formData.dob || null,    
                address: formData.address || null,
                isFirstLogin: true 
            } 
        });
        
        return { success: true, message: "成功" };
    } catch (e) {
        console.error("Registration Error:", e);
        return { success: false, message: "数据库写入失败，请稍后重试" };
    }
}

// 👉 升级：真实的登录并签发 Cookie
// 👉 升级：真实的登录并签发 Cookie，并增加账号状态校验
export async function loginUser(formData: any) {
	try {
		const user = await prisma.user.findUnique({ where: { email: formData.email } });
		if (!user) return { success: false, message: "用户不存在" };
		if (user.password !== formData.password) return { success: false, message: "密码错误" };
        
        // 👉 新增核心拦截：如果账号状态为 Inactive，拒绝登录
        if (user.status === 'Inactive') {
            return { success: false, message: "该账号已被停用，请联系管理员" };
        }
        
        // 登录成功，将用户 ID 存入 HttpOnly Cookie 中（真实的会话保持）
        const cookieStore = await cookies();
        cookieStore.set('userId', user.id.toString(), {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            path: '/',
            maxAge: 60 * 60 * 24 * 7 // 7天有效
        });

		return { success: true, message: "成功" };
	} catch (e) {
		return { success: false, message: "服务器错误" };
	}
}

// 👉 新增：获取当前登录的用户信息
export async function getCurrentUser() {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, data: null };

        const user = await prisma.user.findUnique({
            where: { id: parseInt(userId) },
            // 只选择安全的字段返回给前端，隐藏密码
            select: { 
                id: true, 
                name: true, 
                email: true, 
                role: true, 
                avatarUrl: true, 
                isFirstLogin: true, 
                gender: true, 
                phone:true,
                dob: true,
                address: true
            }
        });
        return { success: true, data: user };
    } catch (error) {
        return { success: false, data: null };
    }
}

// 👉 新增：完成首次登录配置，并关闭 isFirstLogin 状态
export async function completeFirstLogin(data: { avatarUrl?: string | null, gender?: string }) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, message: "未登录" };

        await prisma.user.update({
            where: { id: parseInt(userId) },
            data: {
                avatarUrl: data.avatarUrl,
                gender: data.gender,
                isFirstLogin: false // 👉 核心：在这将状态永久改为 false
            }
        });
        return { success: true };
    } catch (error) {
        return { success: false, message: "保存失败" };
    }
}

export async function logout() {
    const cookieStore = await cookies();
    cookieStore.delete('userId'); 
    redirect('/login');
}

// 👉 更新：增加了昵称唯一性校验
export async function updateAccount(data: {
    name?: string;
    phone?: string;
    gender?: string;
    dob?: string;
    address?: string;
    avatarUrl?: string | null;
}) {
    try {
        const cookieStore = await cookies();
        const userId = cookieStore.get('userId')?.value;
        if (!userId) return { success: false, message: "用户未登录" };

        const currentUserId = parseInt(userId);

        // 👉 核心逻辑：校验昵称是否被其他人使用
        if (data.name) {
            const existingUser = await prisma.user.findFirst({
                where: {
                    name: data.name,
                    id: { not: currentUserId } // 排除当前登录的用户自己
                }
            });
            if (existingUser) {
                return { success: false, message: "该昵称已被人使用" };
            }
        }

        await prisma.user.update({
            where: { id: currentUserId },
            data: {
                name: data.name,
                phone: data.phone,
                gender: data.gender,
                dob: data.dob,
                address: data.address,
                avatarUrl: data.avatarUrl
            }
        });
        return { success: true, message: "个人资料更新成功" };
    } catch (error) {
        console.error("Update account error:", error);
        return { success: false, message: "更新失败，请稍后重试" };
    }
}