'use server';
import { prisma } from '@/lib/prisma';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export async function registerUser(formData: any) {
	try {
		const existing = await prisma.user.findUnique({ where: { email: formData.email } });
		if (existing) {
			return { success: false, message: "邮箱已存在" };
		}

		await prisma.user.create({ data: { email: formData.email, password: formData.password } });
		return { success: true, message: "成功" };
	} catch (e) {
		return { success: false, message: "数据库写入失败" };
	}
}

export async function loginUser(formData: any) {
	try {
		const user = await prisma.user.findUnique({ where: { email: formData.email } });
		if (!user) {
			return { success: false, message: "用户不存在" };
		}
		if (user.password !== formData.password) {
			return { success: false, message: "密码错误" };
		}
		return { success: true, message: "成功" };
	} catch (e) {
		return { success: false, message: "服务器错误" };
	}
}

/**
 * 注销 / 退出登录
 */
export async function logout() {
  // 1. 删除用于维持会话的 Cookie
  // 注意：这里假设你的 Cookie 名字叫 'userId' 或者 'session'
  // 如果你不确定，我们可以把常见的都删了，或者你可以告诉我你 Login 时存的 cookie 名字
  const cookieStore = await cookies();
  cookieStore.delete('userId'); 
  cookieStore.delete('session');
  
  // 2. 重定向回登录页
  redirect('/login');
}