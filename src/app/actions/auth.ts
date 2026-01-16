'use server';
import { prisma } from '@/lib/prisma';

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