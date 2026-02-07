'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, FormControl, InputLabel, Select, MenuItem,
  OutlinedInput, Chip, TextField, Stack, IconButton, Collapse, CircularProgress,
  useTheme,
  Grid 
} from '@mui/material';
import { 
  FilterList as FilterIcon, 
  ExpandMore as ExpandMoreIcon, 
  ExpandLess as ExpandLessIcon,
  BarChart as BarChartIcon
} from '@mui/icons-material';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend
} from 'chart.js';
import { 
  getCompanyChartData, 
  getFilterOptions, 
  type ChartFilterState, 
  type DimensionType 
} from '@/app/actions/company';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function CompanyBarChart() {
  const theme = useTheme();
  const [loading, setLoading] = useState(false);
  const [showFilters, setShowFilters] = useState(false); 
  
  const [chartData, setChartData] = useState<{ labels: string[], data: number[] }>({ labels: [], data: [] });

  const [options, setOptions] = useState({
    levels: [] as number[],
    countries: [] as string[],
    cities: [] as string[]
  });

  const [allLocations, setAllLocations] = useState<{ country: string, city: string }[]>([]);

  const [dimension, setDimension] = useState<DimensionType>('level');
  
  const [filters, setFilters] = useState<ChartFilterState>({
    levels: [],
    countries: [],
    cities: [],
    foundedYear: { start: '', end: '' },
    annualRevenue: { min: '', max: '' },
    employees: { min: '', max: '' },
  });

  useEffect(() => {
    const loadOptions = async () => {
      const res = await getFilterOptions();
      if (res.success && res.data) {
        setOptions({
          levels: res.data.levels,
          countries: res.data.countries,
          cities: res.data.cities
        });
        setAllLocations(res.data.rawLocations || []);
      }
    };
    loadOptions();
  }, []);

  useEffect(() => {
    if (filters.countries.length === 0) {
      const allCities = Array.from(new Set(allLocations.map(l => l.city)));
      setOptions(prev => ({ ...prev, cities: allCities.sort() }));
    } else {
      const filteredCities = allLocations
        .filter(l => filters.countries.includes(l.country))
        .map(l => l.city);
      
      const uniqueFilteredCities = Array.from(new Set(filteredCities)).sort();
      
      setOptions(prev => ({ ...prev, cities: uniqueFilteredCities }));

      setFilters(prev => ({
        ...prev,
        cities: prev.cities.filter(c => uniqueFilteredCities.includes(c))
      }));
    }
  }, [filters.countries, allLocations]);


  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const res = await getCompanyChartData(dimension, filters);
      if (res.success) {
        setChartData({ labels: res.labels || [], data: res.data || [] });
      }
      setLoading(false);
    };

    const timer = setTimeout(fetchData, 500);
    return () => clearTimeout(timer);
  }, [dimension, filters]);

  const handleDimensionChange = (e: any) => setDimension(e.target.value);

  const handleMultiSelectChange = (field: 'levels' | 'countries' | 'cities') => (event: any) => {
    const { target: { value } } = event;
    setFilters(prev => ({
      ...prev,
      [field]: typeof value === 'string' ? value.split(',') : value,
    }));
  };

  const handleRangeChange = (
    category: 'foundedYear' | 'annualRevenue' | 'employees', 
    field: 'min' | 'max' | 'start' | 'end'
  ) => (e: React.ChangeEvent<HTMLInputElement>) => {
    setFilters(prev => ({
      ...prev,
      [category]: { ...prev[category], [field]: e.target.value }
    }));
  };

  const earthColors = {
    primary: '#8d6e63',
    dark: '#5d4037',
    light: '#efebe9', 
    text: '#4e342e',
    barBg: 'rgba(141, 110, 99, 0.85)',
    barBorder: '#5d4037'
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      tooltip: {
        backgroundColor: 'rgba(255, 255, 255, 0.95)',
        titleColor: earthColors.dark,
        bodyColor: earthColors.text,
        borderColor: 'rgba(141, 110, 99, 0.2)',
        borderWidth: 1,
        padding: 12,
        titleFont: { size: 14, weight: 'bold' as const },
        cornerRadius: 8,
        callbacks: {
            label: (context: any) => ` 数量: ${context.raw}`
        }
      }
    },
    scales: {
      y: { 
        beginAtZero: true, 
        grid: { color: 'rgba(141, 110, 99, 0.08)' },
        ticks: { color: earthColors.primary }
      },
      x: { 
        grid: { display: false },
        ticks: { color: earthColors.dark, font: { weight: 'bold' as const } }
      }
    },
  };

  const chartDataConfig = {
    labels: chartData.labels,
    datasets: [
      {
        label: 'Companies',
        data: chartData.data,
        backgroundColor: earthColors.barBg,
        borderColor: earthColors.barBorder,
        borderWidth: 1,
        borderRadius: 4,
        hoverBackgroundColor: earthColors.dark,
        // ✨✨✨ 优化点：限制最大宽度 ✨✨✨
        maxBarThickness: 50,      // 无论有多少数据，柱子最宽 50px
        barPercentage: 0.6,       // 稍微调窄柱子占比
        categoryPercentage: 0.8,  // 调整类别间距
      },
    ],
  };

  return (
    <Paper sx={{ p: 3, borderRadius: 3, boxShadow: 3, border: '1px solid rgba(0,0,0,0.02)' }}>
      <Stack direction={{ xs: 'column', md: 'row' }} justifyContent="space-between" alignItems="center" spacing={2} mb={3}>
        <Stack direction="row" alignItems="center" spacing={1.5}>
            <Box sx={{ p: 1, borderRadius: '10px', bgcolor: earthColors.light, color: earthColors.dark }}>
                <BarChartIcon />
            </Box>
            <Box>
                <Typography variant="h6" fontWeight="800" color={earthColors.text} sx={{ lineHeight: 1.2 }}>
                    动态统计分析
                </Typography>
                <Typography variant="caption" color={earthColors.primary} fontWeight="500">
                    Dynamic Analytics
                </Typography>
            </Box>
        </Stack>

        <Stack direction="row" spacing={2} alignItems="center">
            <Typography variant="body2" fontWeight="bold" color={earthColors.dark}>维度 (X轴):</Typography>
            <FormControl size="small" sx={{ minWidth: 140 }}>
                <Select 
                    value={dimension} 
                    onChange={handleDimensionChange}
                    sx={{ color: earthColors.dark, '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141,110,99,0.3)' } }}
                >
                    <MenuItem value="level">公司等级</MenuItem>
                    <MenuItem value="country">国家</MenuItem>
                    <MenuItem value="city">城市</MenuItem>
                </Select>
            </FormControl>
            
            <IconButton 
                onClick={() => setShowFilters(!showFilters)} 
                sx={{ 
                    border: '1px solid', 
                    borderColor: showFilters ? earthColors.primary : 'rgba(0,0,0,0.1)',
                    color: showFilters ? earthColors.dark : '#9e9e9e',
                    bgcolor: showFilters ? earthColors.light : 'transparent'
                }}
            >
                <FilterIcon />
                {showFilters ? <ExpandLessIcon /> : <ExpandMoreIcon />}
            </IconButton>
        </Stack>
      </Stack>

      <Collapse in={showFilters}>
        <Box sx={{ p: 3, mb: 3, bgcolor: '#fafafa', borderRadius: 2, border: '1px dashed rgba(141,110,99,0.2)' }}>
            <Grid container spacing={2}>
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>包含等级</InputLabel>
                        <Select
                            multiple
                            value={filters.levels}
                            onChange={handleMultiSelectChange('levels')}
                            input={<OutlinedInput label="包含等级" />}
                            renderValue={(selected) => (
                                <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                    {(selected as number[]).map((value) => (
                                        <Chip key={value} label={value} size="small" sx={{ bgcolor: earthColors.light, color: earthColors.dark, fontWeight: 'bold' }} />
                                    ))}
                                </Box>
                            )}
                        >
                            {options.levels.map((lvl) => (
                                <MenuItem key={lvl} value={lvl}>Level {lvl}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>
                
                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>包含国家</InputLabel>
                        <Select
                            multiple
                            value={filters.countries}
                            onChange={handleMultiSelectChange('countries')}
                            input={<OutlinedInput label="包含国家" />}
                            renderValue={(selected) => (selected as string[]).join(', ')}
                        >
                            {options.countries.map((c) => (
                                <MenuItem key={c} value={c}>{c}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <FormControl fullWidth size="small">
                        <InputLabel>包含城市</InputLabel>
                        <Select
                            multiple
                            value={filters.cities}
                            onChange={handleMultiSelectChange('cities')}
                            input={<OutlinedInput label="包含城市" />}
                            renderValue={(selected) => (selected as string[]).join(', ')}
                            disabled={options.cities.length === 0}
                        >
                            {options.cities.map((c) => (
                                <MenuItem key={c} value={c}>{c}</MenuItem>
                            ))}
                        </Select>
                    </FormControl>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField 
                            label="成立年份 (始)" size="small" type="number" fullWidth
                            value={filters.foundedYear.start} 
                            onChange={handleRangeChange('foundedYear', 'start')} 
                        />
                        <Typography color={earthColors.primary}>-</Typography>
                        <TextField 
                            label="止" size="small" type="number" fullWidth
                            value={filters.foundedYear.end} 
                            onChange={handleRangeChange('foundedYear', 'end')} 
                        />
                    </Stack>
                </Grid>

                <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField 
                            label="年收入 (Min)" size="small" type="number" fullWidth
                            value={filters.annualRevenue.min} 
                            onChange={handleRangeChange('annualRevenue', 'min')} 
                        />
                        <Typography color={earthColors.primary}>-</Typography>
                        <TextField 
                            label="Max" size="small" type="number" fullWidth
                            value={filters.annualRevenue.max} 
                            onChange={handleRangeChange('annualRevenue', 'max')} 
                        />
                    </Stack>
                </Grid>

                 <Grid size={{ xs: 12, md: 4 }}>
                    <Stack direction="row" spacing={1} alignItems="center">
                        <TextField 
                            label="员工数 (Min)" size="small" type="number" fullWidth
                            value={filters.employees.min} 
                            onChange={handleRangeChange('employees', 'min')} 
                        />
                        <Typography color={earthColors.primary}>-</Typography>
                        <TextField 
                            label="Max" size="small" type="number" fullWidth
                            value={filters.employees.max} 
                            onChange={handleRangeChange('employees', 'max')} 
                        />
                    </Stack>
                </Grid>
            </Grid>
        </Box>
      </Collapse>

      <Box sx={{ height: 400, position: 'relative' }}>
        {loading && (
            <Box sx={{ 
                position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', 
                bgcolor: 'rgba(255,255,255,0.7)', zIndex: 5, 
                display: 'flex', alignItems: 'center', justifyContent: 'center' 
            }}>
                <CircularProgress sx={{ color: earthColors.primary }} />
            </Box>
        )}
        {chartData.labels.length > 0 ? (
            <Bar options={chartOptions} data={chartDataConfig} />
        ) : (
            <Box sx={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#bdbdbd' }}>
                <Typography>暂无匹配数据，请尝试调整过滤器</Typography>
            </Box>
        )}
      </Box>
    </Paper>
  );
}