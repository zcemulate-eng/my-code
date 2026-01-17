'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';

export interface CompanyFilter {
  search?: string;
  levels?: number[];
  page?: number;      // 新增：当前页码 (1-based)
  pageSize?: number;  // 新增：每页数量
}

export async function getCompanies(filter: CompanyFilter) {
  try {
    // 默认值：第 1 页，每页 10 条
    const { search, levels, page = 1, pageSize = 10 } = filter;
    
    const where: Prisma.CompanyWhereInput = {};

    if (search) {
      where.name = {
        contains: search,
        // mode: 'insensitive', // 如果用 Postgres 建议加上这行
      };
    }

    if (levels && levels.length > 0) {
      where.level = {
        in: levels,
      };
    }

    // 1. 获取符合条件的总数量 (用于前端显示分页)
    const total = await prisma.company.count({ where });

    // 2. 获取当前页的数据
    const rawCompanies = await prisma.company.findMany({
      where,
      orderBy: {
        annualRevenue: 'desc',
      },
      skip: (page - 1) * pageSize, // 跳过前面的数据
      take: pageSize,              // 取 10 条
    });

    const companies = rawCompanies.map((c) => ({
      ...c,
      annualRevenue: Number(c.annualRevenue),
    }));

    // 返回 data 和 total
    return { success: true, data: companies, total };
  } catch (error) {
    console.error("Failed to fetch companies:", error);
    return { success: false, data: [], total: 0 };
  }
}

// ... getCompanyLevels 保持不变
export async function getCompanyLevels() {
  const groups = await prisma.company.groupBy({
    by: ['level'],
    orderBy: { level: 'asc' },
  });
  return groups.map(g => g.level);
}