// src/data/dummyHierarchy.ts

export interface CompanyNode {
  name: string;
  level: string; // "Root" | "Level 1" | "Level 2" | "Level 3"
  value?: number; // 用于气泡大小
  country?: string;
  city?: string;
  foundedYear?: number;
  revenue?: string; 
  employees?: number;
  children?: CompanyNode[];
}

// 辅助函数
const randomInt = (min: number, max: number) => Math.floor(Math.random() * (max - min + 1)) + min;
const pick = <T>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const locationMap: Record<string, string[]> = {
  'Canada': ['Calgary', 'Hamilton', 'Montreal', 'Ottawa', 'Winnipeg'],
  'China': ['Beijing', 'Guangzhou', 'Hangzhou', 'Nanjing', 'Shanghai', 'Shenzhen', 'Tianjin'],
  'France': ['Bordeaux', 'Lille', 'Lyon', 'Marseille', 'Montpellier', 'Nantes', 'Nice', 'Toulouse'],
  'Germany': ['Berlin', 'Cologne', 'Dortmund', 'Essen', 'Frankfurt', 'Leipzig', 'Munich', 'Stuttgart'],
  'India': ['Bangalore', 'Delhi', 'Hyderabad', 'Jaipur'],
  'Japan': ['Fukuoka', 'Kawasaki', 'Kobe', 'Nagoya', 'Osaka', 'Saitama', 'Sapporo', 'Tokyo', 'Yokohama'],
  'UK': ['Birmingham', 'Bristol', 'Cardiff', 'Edinburgh', 'Liverpool', 'London', 'Manchester', 'Sheffield'],
  'USA': ['Chicago', 'Dallas', 'Houston', 'Los Angeles', 'Philadelphia', 'San Jose']
};

const countries = Object.keys(locationMap);

const prefixes = ['Global', 'Tech', 'Eco', 'Smart', 'Future', 'Cyber', 'Nano', 'Green', 'Data', 'Cloud'];
const suffixes = ['Corp', 'Inc', 'Ltd', 'Group', 'Systems', 'Solutions', 'Logistics', 'Holdings'];

const generateName = (level: number, index: number) => {
  return `${pick(prefixes)} ${pick(suffixes)} (${index})`;
};

const generateChildren = (currentDepth: number, maxDepth: number): CompanyNode[] | undefined => {
  if (currentDepth > maxDepth) return undefined;

  const numChildren = randomInt(3, 6); 
  const children: CompanyNode[] = [];

  for (let i = 1; i <= numChildren; i++) {
    const country = pick(countries);
    const city = pick(locationMap[country]);
    
    const baseRevenue = 1000 / currentDepth; 
    const revenueVal = randomInt(baseRevenue * 0.5, baseRevenue * 1.5);
    
    const node: CompanyNode = {
      name: generateName(currentDepth, i),
      level: `Level ${currentDepth}`,
      country: country,
      city: city,
      foundedYear: randomInt(1990, 2024),
      revenue: `$${revenueVal.toFixed(1)}M`,
      employees: randomInt(50, 5000) * (4 - currentDepth),
    };

    if (currentDepth < maxDepth) {
      const childNodes = generateChildren(currentDepth + 1, maxDepth);
      if (childNodes) {
        node.children = childNodes;
      }
    } else {
      node.value = revenueVal;
    }

    children.push(node);
  }

  return children;
};

// 🌟🌟🌟 核心修改：使用 window 对象进行全局缓存 🌟🌟🌟
// 定义一个类型以避免 TypeScript 报错 (可选，或者直接用 any)
declare global {
  interface Window {
    __BUBBLE_CHART_CACHE__?: CompanyNode;
  }
}

export const getBubbleChartData = (): CompanyNode => {
  // 1. 检查浏览器环境
  if (typeof window === 'undefined') {
    // 服务端渲染时，返回临时数据（不会被缓存）
    return generateNewData();
  }

  // 2. 检查全局缓存是否存在
  if (window.__BUBBLE_CHART_CACHE__) {
    // console.log("Using cached bubble chart data"); // 调试用
    return window.__BUBBLE_CHART_CACHE__;
  }

  // 3. 如果没有缓存，生成新数据并挂载到 window
  // console.log("Generating new bubble chart data..."); // 调试用
  const newData = generateNewData();
  window.__BUBBLE_CHART_CACHE__ = newData;
  
  return newData;
};

// 抽取生成逻辑为独立函数
const generateNewData = (): CompanyNode => {
  return {
    name: "Global Supply Chain Network",
    level: "Root",
    children: [
      {
        name: "Alpha Holdings (L1)",
        level: "Level 1",
        country: "USA",
        city: "Chicago", 
        foundedYear: 1995,
        revenue: "$5.2B",
        employees: 45000,
        children: generateChildren(2, 3) 
      },
      {
        name: "Beta Logistics (L1)",
        level: "Level 1",
        country: "China",
        city: "Shanghai",
        foundedYear: 2008,
        revenue: "$3.8B",
        employees: 32000,
        children: generateChildren(2, 3) 
      },
      {
        name: "Gamma Systems (L1)",
        level: "Level 1",
        country: "Germany",
        city: "Berlin",
        foundedYear: 2001,
        revenue: "$4.5B",
        employees: 28000,
        children: generateChildren(2, 3) 
      }
    ]
  };
};

// 提供手动清除缓存的方法（例如在注销时调用）
export const clearBubbleChartCache = () => {
  if (typeof window !== 'undefined') {
    delete window.__BUBBLE_CHART_CACHE__;
  }
};