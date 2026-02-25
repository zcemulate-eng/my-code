// src/app/actions/company.ts
'use server';

import { prisma } from '@/lib/prisma';
import { Prisma } from '@prisma/client';
import { cookies } from 'next/headers'; // 👉 新增：引入 cookies

export interface CompanyFilter {
  search?: string;
  levels?: number[];
  page?: number;
  pageSize?: number;
}

// 👉 新增：Nest.js 后端地址与鉴权 Helper
const API_BASE_URL = 'http://localhost:3001/api/companies';

async function getAuthHeaders() {
  const cookieStore = await cookies();
  const userId = cookieStore.get('userId')?.value;
  return {
    'Content-Type': 'application/json',
    ...(userId ? { Cookie: `userId=${userId}` } : {})
  };
}

// 1. 获取公司列表 (改为调用 Nest.js API)
export async function getCompanies(filter: CompanyFilter) {
  try {
    const query = new URLSearchParams();
    if (filter.search) query.append('search', filter.search);
    if (filter.levels && filter.levels.length > 0) query.append('levels', filter.levels.join(','));
    if (filter.page) query.append('page', filter.page.toString());
    if (filter.pageSize) query.append('pageSize', filter.pageSize.toString());

    const res = await fetch(`${API_BASE_URL}?${query.toString()}`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    console.error("Fetch companies error:", error);
    return { success: false, data: [], total: 0 };
  }
}

// 2. 获取所有的层级选项 (改为调用 Nest.js API)
export async function getCompanyLevels() {
  try {
    const res = await fetch(`${API_BASE_URL}/levels`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    const result = await res.json();
    return result.success ? result.data : [];
  } catch (error) {
    console.error("Fetch company levels error:", error);
    return [];
  }
}

// 👉 新增：创建公司
export async function createCompany(data: any) {
  try {
    const res = await fetch(API_BASE_URL, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: '网络请求错误' };
  }
}

// 👉 新增：更新公司
export async function updateCompany(id: number, data: any) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'PUT',
      headers: await getAuthHeaders(),
      body: JSON.stringify(data),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: '网络请求错误' };
  }
}

// 👉 新增：删除公司
export async function deleteCompany(id: number) {
  try {
    const res = await fetch(`${API_BASE_URL}/${id}`, {
      method: 'DELETE',
      headers: await getAuthHeaders(),
    });
    return await res.json();
  } catch (error) {
    return { success: false, message: '网络请求错误' };
  }
}


// src/app/actions/company.ts (下半部分替换)

// 3. 获取 Dashboard 统计数据 (调用 Nest.js)
export async function getDashboardStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats/basic`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    return { success: false, data: { totalCompanies: 0, totalRevenue: 0, totalEmployees: 0, uniqueCountries: 0 } };
  }
}

// 4. 获取公司等级分布统计 (调用 Nest.js)
export async function getCompanyLevelStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats/levels`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    return { success: false, data: [] };
  }
}

// 5. 获取供应链网络增长趋势 (调用 Nest.js)
export async function getCompanyGrowthStats() {
  try {
    const res = await fetch(`${API_BASE_URL}/stats/growth`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    return { success: false, data: [] };
  }
}

export type DimensionType = 'level' | 'country' | 'city';

export interface ChartFilterState {
  levels: number[];
  countries: string[];
  cities: string[];
  foundedYear: { start: string; end: string };
  annualRevenue: { min: string; max: string };
  employees: { min: string; max: string };
}

// 6. 获取 Filter 选项
export async function getFilterOptions() {
  try {
    const res = await fetch(`${API_BASE_URL}/filters`, {
      headers: await getAuthHeaders(),
      cache: 'no-store',
    });
    return await res.json();
  } catch (error) {
    return { success: false, data: { levels: [], countries: [], cities: [], rawLocations: [] } };
  }
}

// 7. 调用分析引擎获取图表数据
export async function getAnalyticsData(dimension: DimensionType, filters: ChartFilterState) {
  try {
    const res = await fetch(`${API_BASE_URL}/analytics`, {
      method: 'POST',
      headers: await getAuthHeaders(),
      body: JSON.stringify({ dimension, filters }),
    });
    return await res.json();
  } catch (error) {
    return { success: false, barChart: { labels: [], data: [] }, bubbleChart: null };
  }
}