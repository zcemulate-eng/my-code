// src/app/(main)/dashboard/page.tsx
'use client';

import React, { useEffect, useState, useMemo } from 'react';
import {
  Typography,
  Grid,
  Card,
  CardContent,
  Box,
  Stack,
  Skeleton,
  Alert,
  Tooltip as MuiTooltip,
  Paper,
  Zoom
} from '@mui/material';
import BusinessIcon from '@mui/icons-material/Business';
import MonetizationOnIcon from '@mui/icons-material/MonetizationOn';
import PublicIcon from '@mui/icons-material/Public';
import GroupIcon from '@mui/icons-material/Group';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';

import { 
    Chart as ChartJS, 
    ArcElement, 
    Tooltip, 
    Legend, 
    ActiveElement, 
    ChartEvent,
    CategoryScale,
    LinearScale,
    PointElement,
    LineElement,
    Filler
} from 'chart.js';
import { Doughnut, Line } from 'react-chartjs-2';

import { getDashboardStats, getCompanyLevelStats, getCompanyGrowthStats } from '@/app/actions/company';

// 注册 Chart.js 组件
ChartJS.register(
    ArcElement, 
    Tooltip, 
    Legend, 
    CategoryScale, 
    LinearScale, 
    PointElement, 
    LineElement, 
    Filler
);

// --- 辅助函数 & 组件 ---
const formatLargeNumber = (num: number, isCurrency: boolean = false): string => {
  if (num === 0) return '0';
  const absNum = Math.abs(num);
  let formatted = '';
  let suffix = '';
  if (absNum >= 1.0e+9) { suffix = 'B'; formatted = (absNum / 1.0e+9).toFixed(1); }
  else if (absNum >= 1.0e+6) { suffix = 'M'; formatted = (absNum / 1.0e+6).toFixed(1); }
  else if (absNum >= 1.0e+3) { suffix = 'K'; formatted = (absNum / 1.0e+3).toFixed(1); }
  else { formatted = absNum.toString(); }
  if (formatted.endsWith('.0')) formatted = formatted.slice(0, -2);
  const sign = num < 0 ? '-' : '';
  const prefix = isCurrency ? '$' : '';
  return `${sign}${prefix}${formatted}${suffix}`;
};

interface StatCardProps { title: string; value: string | number; icon: React.ReactNode; color: string; loading?: boolean; }
const StatCard = ({ title, value, icon, color, loading = false }: StatCardProps) => (
  <Card elevation={0} sx={{ borderRadius: '20px', background: 'linear-gradient(145deg, #ffffff 0%, #f9f9f9 100%)', border: '1px solid rgba(0,0,0,0.06)', boxShadow: '0 2px 10px rgba(0,0,0,0.03)', transition: 'all 0.2s ease-in-out', '&:hover': { transform: 'translateY(-3px)', boxShadow: '0 5px 15px rgba(0,0,0,0.08)', borderColor: 'rgba(0,0,0,0.1)' } }}>
    <CardContent sx={{ p: 2.5, '&:last-child': { pb: 2.5 } }}>
      <Stack direction="row" spacing={2} alignItems="center">
        <Box sx={{ p: 1.25, borderRadius: '14px', bgcolor: `${color}15`, color: color, display: 'flex', alignItems: 'center', justifyContent: 'center', minWidth: '48px', height: '48px' }}>{icon}</Box>
        <Box sx={{ flexGrow: 1, minWidth: 0 }}>
          <Typography variant="body2" sx={{ color: '#8d6e63', fontWeight: 600, mb: 0.2, fontSize: '0.85rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{title}</Typography>
          {loading ? <Skeleton variant="text" width="80%" height={32} /> : <Typography variant="h5" sx={{ fontWeight: 800, color: '#4e342e', lineHeight: 1.2, fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif', whiteSpace: 'nowrap' }}>{value}</Typography>}
        </Box>
      </Stack>
    </CardContent>
  </Card>
);

const DetailedStatsTooltip = ({ levelStats, total }: { levelStats: { level: number; count: number }[], total: number }) => {
    const colors = ['#2e7d32', '#8d6e63', '#d7ccc8', '#bcaaa4'];
    return (
        <Box sx={{ p: 1 }}>
            <Typography variant="subtitle2" sx={{ fontWeight: 800, color: '#fff', mb: 1.5, borderBottom: '1px solid rgba(255,255,255,0.2)', pb: 0.5 }}>
                层级详情 (Level Details)
            </Typography>
            <Stack spacing={1}>
                {levelStats.map((item, index) => {
                     const percentage = total > 0 ? ((item.count / total) * 100).toFixed(1) + '%' : '0%';
                     const color = colors[index % colors.length];
                     return (
                         <Stack key={item.level} direction="row" justifyContent="space-between" alignItems="center" spacing={4} sx={{ minWidth: '180px' }}>
                             <Stack direction="row" spacing={1} alignItems="center">
                                 <Box sx={{ width: 8, height: 8, borderRadius: '50%', bgcolor: color }} />
                                 <Typography variant="body2" sx={{ color: '#fff', fontWeight: 500 }}>
                                     Level {item.level}
                                 </Typography>
                             </Stack>
                             <Stack direction="row" spacing={2}>
                                <Typography variant="body2" sx={{ color: '#fff', fontWeight: 700 }}>
                                     {item.count}
                                 </Typography>
                                 <Typography variant="body2" sx={{ color: 'rgba(255,255,255,0.7)', width: '40px', textAlign: 'right' }}>
                                     {percentage}
                                 </Typography>
                             </Stack>
                         </Stack>
                     )
                })}
            </Stack>
        </Box>
    );
};

export default function DashboardPage() {
    const [stats, setStats] = useState({ totalCompanies: 0, totalRevenue: 0, uniqueCountries: 0, totalEmployees: 0 });
    const [levelStats, setLevelStats] = useState<{ level: number; count: number }[]>([]);
    const [growthStats, setGrowthStats] = useState<{ year: number; count: number }[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [centerLabel, setCenterLabel] = useState('Total');
    const [centerValue, setCenterValue] = useState<string | number>('0');

    useEffect(() => {
        const loadData = async () => {
            try {
                const [basicStatsRes, levelStatsRes, growthStatsRes] = await Promise.all([
                    getDashboardStats(),
                    getCompanyLevelStats(),
                    getCompanyGrowthStats()
                ]);

                if (basicStatsRes.success && basicStatsRes.data) {
                    setStats(basicStatsRes.data);
                    setCenterValue(basicStatsRes.data.totalCompanies);
                }
                if (levelStatsRes.success && levelStatsRes.data) {
                    setLevelStats(levelStatsRes.data);
                }
                if (growthStatsRes.success && growthStatsRes.data) {
                    const validGrowthData = (growthStatsRes.data as { year: number; count: number }[])
                        .filter(item => item.year > 1950); 
                    setGrowthStats(validGrowthData);
                }
            } catch (err) {
                setError('获取数据失败');
            } finally {
                setLoading(false);
            }
        };
        loadData();
    }, []);

    // --- Doughnut Config ---
    const doughnutData = useMemo(() => {
        const safeData = levelStats || [];
        return {
            labels: safeData.map(item => `Level ${item.level}`),
            datasets: [{
                data: safeData.map(item => item.count),
                backgroundColor: ['#2e7d32', '#8d6e63', '#d7ccc8', '#bcaaa4'],
                borderColor: 'transparent',
                borderWidth: 0,
                hoverOffset: 10,
            }],
        };
    }, [levelStats]);

    const doughnutOptions = {
        cutout: '80%',
        plugins: {
            legend: { display: false },
            tooltip: {
                enabled: true,
                // 修改点：改为 'top'，让箭头指向上方，Tooltip 本身就会出现在鼠标下方
                yAlign: 'top' as const, 
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#5d4037',
                bodyColor: '#4e342e',
                titleFont: { size: 13, weight: 'bold' as const },
                padding: 12,
                cornerRadius: 8,
                displayColors: true,
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                callbacks: {
                    label: function(context: any) {
                        const value = context.raw || 0;
                        const total = context.chart._metasets[context.datasetIndex].total;
                        const percentage = ((value / total) * 100).toFixed(1) + '%';
                        return ` 占比: ${percentage}`;
                    }
                }
            }
        },
        onHover: (event: ChartEvent, elements: ActiveElement[]) => {
            if (elements && elements.length > 0) {
                const index = elements[0].index;
                const dataItem = levelStats[index];
                if (dataItem) {
                    setCenterLabel(`Level ${dataItem.level}`);
                    setCenterValue(dataItem.count);
                }
            } else {
                setCenterLabel('Total');
                setCenterValue(stats.totalCompanies);
            }
        },
        maintainAspectRatio: false,
    };

    // --- Line Chart Config ---
    const lineChartData = useMemo(() => {
        return {
            labels: growthStats.map(item => item.year.toString()),
            datasets: [
                {
                    label: '累积公司规模',
                    data: growthStats.map(item => item.count),
                    fill: true,
                    backgroundColor: (context: any) => {
                        const ctx = context.chart.ctx;
                        const gradient = ctx.createLinearGradient(0, 0, 0, 400);
                        gradient.addColorStop(0, 'rgba(46, 125, 50, 0.15)');
                        gradient.addColorStop(1, 'rgba(46, 125, 50, 0.0)');
                        return gradient;
                    },
                    borderColor: '#2e7d32',
                    borderWidth: 3,
                    tension: 0.4,
                    pointBackgroundColor: '#fff',
                    pointBorderColor: '#2e7d32',
                    pointBorderWidth: 2,
                    pointRadius: 4,
                    pointHoverRadius: 7,
                },
            ],
        };
    }, [growthStats]);

    const lineChartOptions = {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
            legend: { display: false },
            tooltip: {
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                titleColor: '#5d4037',
                bodyColor: '#2e7d32',
                titleFont: { size: 14, weight: 'bold' as const },
                bodyFont: { size: 14, weight: 'bold' as const },
                padding: 12,
                cornerRadius: 8,
                borderColor: 'rgba(0,0,0,0.05)',
                borderWidth: 1,
                displayColors: false,
                callbacks: {
                    title: (context: any) => `年份: ${context[0].label}`,
                    label: (context: any) => `公司数量: ${context.raw} 家企业`
                }
            }
        },
        scales: {
            x: {
                grid: { display: false, drawBorder: false },
                ticks: { color: '#8d6e63', maxTicksLimit: 8 }
            },
            y: {
                grid: {
                    color: 'rgba(0, 0, 0, 0.04)',
                    borderDash: [5, 5],
                    drawBorder: false,
                },
                ticks: {
                    color: '#8d6e63',
                    callback: function(value: any) {
                        return value >= 1000 ? value / 1000 + 'k' : value;
                    }
                },
                beginAtZero: true
            }
        },
        interaction: { mode: 'index' as const, intersect: false },
    };

    return (
        <Box sx={{ pb: 4 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4e342e', mb: 1 }}>Dashboard</Typography>
                <Typography variant="body1" sx={{ color: '#8d6e63' }}>供应链公司实时数据概览</Typography>
            </Box>

            {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

            {/* 数据卡片 */}
            <Grid container spacing={3} sx={{ mb: 4 }}>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="合作企业" value={formatLargeNumber(stats.totalCompanies)} icon={<BusinessIcon sx={{ fontSize: 28 }} />} color="#5d4037" loading={loading} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="总营收" value={formatLargeNumber(stats.totalRevenue, true)} icon={<MonetizationOnIcon sx={{ fontSize: 28 }} />} color="#2e7d32" loading={loading} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="覆盖国家" value={stats.uniqueCountries} icon={<PublicIcon sx={{ fontSize: 28 }} />} color="#0288d1" loading={loading} /></Grid>
                <Grid size={{ xs: 12, sm: 6, md: 3 }}><StatCard title="员工规模" value={formatLargeNumber(stats.totalEmployees)} icon={<GroupIcon sx={{ fontSize: 28 }} />} color="#e64a19" loading={loading} /></Grid>
            </Grid>

            <Grid container spacing={3}>
                {/* 1. 圆环图 (Doughnut) */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Paper elevation={0} sx={{ 
                        p: 4, 
                        borderRadius: '24px', 
                        height: '380px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        background: '#ffffff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        alignItems: 'center',
                        justifyContent: 'center',
                        position: 'relative'
                    }}>
                         <Typography variant="h6" sx={{ position: 'absolute', top: 24, left: 32, fontWeight: 800, color: '#4e342e' }}>
                            层级分布
                        </Typography>

                        <Box sx={{ 
                            position: 'relative', 
                            height: '240px', 
                            width: '100%', 
                            maxWidth: '280px', 
                            mt: 2 
                        }}>
                            {loading ? (
                                <Skeleton variant="circular" width={200} height={200} sx={{ mx: 'auto', mt: 3 }} />
                            ) : (
                                <>
                                    <Doughnut data={doughnutData} options={doughnutOptions} />
                                    <MuiTooltip 
                                        title={<DetailedStatsTooltip levelStats={levelStats} total={stats.totalCompanies} />}
                                        arrow
                                        placement="top"
                                        TransitionComponent={Zoom}
                                        slotProps={{
                                            tooltip: {
                                                sx: {
                                                    bgcolor: 'rgba(62, 39, 35, 0.95)',
                                                    borderRadius: '16px',
                                                    p: 0,
                                                    maxWidth: 'none'
                                                }
                                            },
                                            arrow: { sx: { color: 'rgba(62, 39, 35, 0.95)' } }
                                        }}
                                        disableHoverListener={centerLabel !== 'Total'}
                                    >
                                        <Box sx={{
                                            position: 'absolute',
                                            top: '50%',
                                            left: '50%',
                                            transform: 'translate(-50%, -50%)',
                                            textAlign: 'center',
                                            cursor: 'pointer',
                                            zIndex: 10,
                                            width: '120px',
                                            height: '120px',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            justifyContent: 'center',
                                            alignItems: 'center',
                                            borderRadius: '50%'
                                        }}>
                                            <Typography variant="h3" sx={{ 
                                                fontWeight: 900, 
                                                color: centerLabel === 'Total' ? '#4e342e' : '#2e7d32',
                                                lineHeight: 1,
                                                mb: 0.5,
                                                transition: 'color 0.3s ease'
                                            }}>
                                                {centerValue}
                                            </Typography>
                                            <Typography variant="body1" sx={{ color: '#8d6e63', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
                                                {centerLabel}
                                            </Typography>
                                        </Box>
                                    </MuiTooltip>
                                </>
                            )}
                        </Box>
                    </Paper>
                </Grid>

                {/* 2. 折线图 (Line Chart) */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Paper elevation={0} sx={{ 
                        p: 4, 
                        borderRadius: '24px', 
                        height: '380px',
                        border: '1px solid rgba(0,0,0,0.06)',
                        background: '#ffffff',
                        boxShadow: '0 4px 20px rgba(0,0,0,0.02)',
                        display: 'flex',
                        flexDirection: 'column',
                        position: 'relative'
                    }}>
                        <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 3 }}>
                            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: '#e8f5e9', color: '#2e7d32' }}>
                                <TrendingUpIcon />
                            </Box>
                            <Box>
                                <Typography variant="h6" sx={{ fontWeight: 800, color: '#4e342e', lineHeight: 1.2 }}>
                                    供应链公司数量增长趋势
                                </Typography>
                                <Typography variant="caption" sx={{ color: '#8d6e63', fontWeight: 500 }}>
                                    Cumulative Network Growth
                                </Typography>
                            </Box>
                        </Stack>

                        <Box sx={{ flexGrow: 1, width: '100%', position: 'relative' }}>
                            {loading ? (
                                <Skeleton variant="rectangular" width="100%" height="100%" sx={{ borderRadius: '16px' }} />
                            ) : (
                                <Line data={lineChartData} options={lineChartOptions} />
                            )}
                        </Box>
                    </Paper>
                </Grid>
            </Grid>
        </Box>
    );
}