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

// 新增：获取 Dashboard 统计数据
export async function getDashboardStats() {
  try {
    // 1. 并行执行所有统计查询以提高速度
    const [
      aggregateData,
      countryGroups
    ] = await Promise.all([
      // 查询 A: 聚合计算 (总数、营收总和、员工总和)
      prisma.company.aggregate({
        _count: {
          id: true, // 统计公司总数
        },
        _sum: {
          annualRevenue: true, // 统计营收总和
          employees: true,     // 统计员工总和
        },
      }),
      // 查询 B: 统计国家数量 (去重)
      // Prisma 目前没有直接的 distinct count，通常用 groupBy 或 findMany distinct
      prisma.company.groupBy({
        by: ['country'],
        _count: {
          country: true
        }
      })
    ]);

    // 2. 处理 BigInt 问题 (BigInt 无法直接 JSON 序列化)
    // 如果营收是 null，默认为 0
    const totalRevenue = aggregateData._sum.annualRevenue
      ? Number(aggregateData._sum.annualRevenue)
      : 0;

    return {
      success: true,
      data: {
        totalCompanies: aggregateData._count.id,
        totalRevenue: totalRevenue,
        totalEmployees: aggregateData._sum.employees || 0,
        uniqueCountries: countryGroups.length // group by 后的数组长度即为去重后的国家数
      }
    };

  } catch (error) {
    console.error("Dashboard stats error:", error);
    return {
      success: false,
      data: {
        totalCompanies: 0,
        totalRevenue: 0,
        totalEmployees: 0,
        uniqueCountries: 0
      }
    };
  }
}

// 新增：获取公司等级分布统计
export async function getCompanyLevelStats() {
  try {
    const levelStats = await prisma.company.groupBy({
      by: ['level'],
      _count: {
        level: true,
      },
      orderBy: {
        level: 'asc',
      },
    });

    // 格式化数据，返回: [{ level: 1, count: 12 }, { level: 2, count: 5 }, ...]
    return {
      success: true,
      data: levelStats.map(stat => ({
        level: stat.level,
        count: stat._count.level
      }))
    };
  } catch (error) {
    console.error("Level stats error:", error);
    return { success: false, data: [] };
  }
}

// 新增：获取供应链网络增长趋势（累积数据）
export async function getCompanyGrowthStats() {
  try {
    // 1. 按成立年份分组统计 (过滤掉没有成立年份的数据)
    const companiesByYear = await prisma.company.groupBy({
      by: ['foundedYear'],
      _count: {
        id: true,
      },
      where: {
        foundedYear: {
          not: null,
        },
      },
      orderBy: {
        foundedYear: 'asc',
      },
    });

    // 2. 计算累积数值 (Cumulative Sum)
    // 比如: 2000年新增1 -> 总1; 2001年新增3 -> 总4
    let cumulativeCount = 0;
    const growthStats = companiesByYear.map((item) => {
      if (item.foundedYear === null) return null; // 理论上已被 where 过滤

      cumulativeCount += item._count.id;

      return {
        year: item.foundedYear,
        count: cumulativeCount, // 这里存的是截至该年的总数
      };
    }).filter(item => item !== null); // 再次确保安全

    return {
      success: true,
      data: growthStats
    };
  } catch (error) {
    console.error("Growth stats error:", error);
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

// 1. 获取 Filter 选项
export async function getFilterOptions() {
  try {
    const [levels, locations] = await Promise.all([
      // 1. 获取所有 Level
      prisma.company.groupBy({ by: ['level'], orderBy: { level: 'asc' } }),
      
      // 2. 获取所有不重复的 Country + City 组合
      // 这样我们就能知道哪个 City 属于哪个 Country
      prisma.company.groupBy({
        by: ['country', 'city'],
        where: {
          country: { not: null },
          city: { not: null }
        },
        orderBy: { country: 'asc' }
      })
    ]);
    
    // 提取去重后的国家列表
    const uniqueCountries = Array.from(new Set(locations.map(l => l.country).filter(Boolean))) as string[];
    
    // 提取去重后的城市列表 (初始状态显示所有城市)
    const uniqueCities = Array.from(new Set(locations.map(l => l.city).filter(Boolean))) as string[];

    return {
      success: true,
      data: {
        levels: levels.map(l => l.level),
        countries: uniqueCountries,
        cities: uniqueCities,
        // 新增：返回原始的位置映射数据，供前端做级联筛选
        rawLocations: locations.map(l => ({ country: l.country as string, city: l.city as string }))
      }
    };
  } catch (error) {
    console.error("Filter options error:", error);
    return { success: false, data: { levels: [], countries: [], cities: [], rawLocations: [] } };
  }
}

// 2. 获取动态图表数据
export async function getCompanyChartData(
  dimension: DimensionType, 
  filters: ChartFilterState
) {
  try {
    const where: Prisma.CompanyWhereInput = {};

    // --- 构建筛选条件 ---
    if (filters.levels.length > 0) where.level = { in: filters.levels };
    if (filters.countries.length > 0) where.country = { in: filters.countries };
    if (filters.cities.length > 0) where.city = { in: filters.cities };

    // 范围查询 (foundedYear 是必填 Int)
    if (filters.foundedYear.start || filters.foundedYear.end) {
      where.foundedYear = {};
      if (filters.foundedYear.start) where.foundedYear.gte = parseInt(filters.foundedYear.start);
      if (filters.foundedYear.end) where.foundedYear.lte = parseInt(filters.foundedYear.end);
    }

    // 范围查询 (employees 是必填 Int)
    if (filters.employees.min || filters.employees.max) {
      where.employees = {};
      if (filters.employees.min) where.employees.gte = parseInt(filters.employees.min);
      if (filters.employees.max) where.employees.lte = parseInt(filters.employees.max);
    }

    // 范围查询 (annualRevenue 是 BigInt)
    if (filters.annualRevenue.min || filters.annualRevenue.max) {
      where.annualRevenue = {};
      if (filters.annualRevenue.min) where.annualRevenue.gte = BigInt(filters.annualRevenue.min);
      if (filters.annualRevenue.max) where.annualRevenue.lte = BigInt(filters.annualRevenue.max);
    }

    // --- 聚合查询 ---
    // 强制断言 dimension 类型以通过 TS 检查
    const groupByField = dimension as 'level' | 'country' | 'city';

    const results = await prisma.company.groupBy({
      by: [groupByField],
      _count: { id: true },
      where: where,
      orderBy: { _count: { id: 'desc' } },
      take: 20 // 限制显示前 20 个结果
    });

    // 过滤掉结果中 key 为 null 的数据 (主要针对 country/city)
    const validResults = results.filter(item => item[groupByField] !== null);

    return { 
      success: true, 
      labels: validResults.map(item => String(item[groupByField])), 
      data: validResults.map(item => item._count.id) 
    };

  } catch (error) {
    console.error("Chart data error:", error);
    return { success: false, labels: [], data: [] };
  }
}