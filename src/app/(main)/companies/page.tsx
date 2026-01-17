'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, MenuItem, Select, InputLabel, FormControl,
  Chip, Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  IconButton, Collapse, InputAdornment, OutlinedInput, SelectChangeEvent,
  TablePagination
} from '@mui/material';
import {
  KeyboardArrowDown as KeyboardArrowDownIcon,
  KeyboardArrowUp as KeyboardArrowUpIcon,
  Search as SearchIcon
} from '@mui/icons-material';
import { getCompanies, getCompanyLevels } from '@/app/actions/company';

// --- 类型定义 ---
interface CompanyData {
  id: number;
  companyCode: string;
  name: string;
  level: number;
  country: string | null;
  city: string | null;
  foundedYear: number | null;
  annualRevenue: number;
  employees: number | null;
}

// --- 工具函数：格式化货币 ---
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD', 
    maximumFractionDigits: 0 
  }).format(value);
};

// --- 子组件：可折叠的行 (Row) ---
function Row({ row }: { row: CompanyData }) {
  const [open, setOpen] = useState(false);

  // 计算盈利效率
  const empCount = row.employees || 0;
  const efficiency = empCount > 0 ? row.annualRevenue / empCount : 0;

  // 动态背景色逻辑 (热力图效果)
  const getEfficiencyColor = (val: number) => {
    if (val > 500000) return 'rgba(109, 140, 125, 0.4)'; // 深绿 (极高)
    if (val > 200000) return 'rgba(109, 140, 125, 0.2)'; // 浅绿 (高)
    if (val > 100000) return 'rgba(255, 253, 245, 0.5)'; // 米色 (正常)
    return 'rgba(255, 171, 145, 0.2)'; // 淡红 (低)
  };

  return (
    <React.Fragment>
      {/* 外层行 */}
      <TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'rgba(109, 140, 125, 0.05)' : 'inherit' }}>
        <TableCell>
          <IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
            {open ? <KeyboardArrowUpIcon sx={{ color: '#6d8c7d' }} /> : <KeyboardArrowDownIcon sx={{ color: '#8d6e63' }} />}
          </IconButton>
        </TableCell>
        <TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#5d4037' }}>
          {row.name}
        </TableCell>
        <TableCell align="left">
          <Chip 
            label={`Level ${row.level}`} 
            size="small" 
            sx={{ 
              backgroundColor: '#efebe9', 
              color: '#5d4037',
              fontWeight: 500
            }} 
          />
        </TableCell>
        <TableCell align="left" sx={{ color: '#637381' }}>{row.country || '-'}</TableCell>
        <TableCell 
          align="right" 
          sx={{ 
            backgroundColor: getEfficiencyColor(efficiency),
            fontWeight: 'bold',
            color: '#5d4037',
            transition: 'background-color 0.3s'
          }}
        >
          {formatCurrency(efficiency)} / emp
        </TableCell>
      </TableRow>

      {/* 折叠详情行 */}
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={6}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 2, ml: 8, p: 3, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px dashed rgba(141, 110, 99, 0.2)' }}>
              <Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#6d8c7d', mb: 2 }}>
                详细数据 (Details)
              </Typography>
              <Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
                <div>
                  <Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>编号 (Code)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 600 }}>{row.companyCode}</Typography>
                </div>
                <div>
                  <Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>城市 (City)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.city || '-'}</Typography>
                </div>
                <div>
                  <Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>创始年份 (Founded)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{row.foundedYear || '-'}</Typography>
                </div>
                <div>
                  <Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>年营收 (Revenue)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(row.annualRevenue)}</Typography>
                </div>
                <div>
                  <Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>员工数 (Employees)</Typography>
                  <Typography variant="body2" sx={{ fontWeight: 500 }}>{empCount.toLocaleString()}</Typography>
                </div>
              </Box>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

// --- 主页面组件 ---
export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [allLevels, setAllLevels] = useState<number[]>([]);
  
  // 筛选状态
  const [searchName, setSearchName] = useState('');
  const [selectedLevels, setSelectedLevels] = useState<number[]>([]);

  // 分页状态
  const [page, setPage] = useState(0); // MUI page 从 0 开始
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [totalCount, setTotalCount] = useState(0);

  // 初始化加载
  useEffect(() => {
    getCompanyLevels().then(setAllLevels);
  }, []);

  // 当筛选条件改变时，重置回第一页
  useEffect(() => {
    setPage(0);
  }, [searchName, selectedLevels]);

  // 统一的数据获取 Effect (带防抖)
  useEffect(() => {
    const timer = setTimeout(() => {
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedLevels, page, rowsPerPage]);

  const fetchData = async () => {
    const result = await getCompanies({
      search: searchName,
      levels: selectedLevels,
      page: page + 1, // 转换给后端的 page (1-based)
      pageSize: rowsPerPage
    });
    if (result.success) {
      setCompanies(result.data as CompanyData[]);
      setTotalCount(result.total || 0);
    }
  };

  const handleLevelChange = (event: SelectChangeEvent<number[]>) => {
    const { target: { value } } = event;
    setSelectedLevels(
      typeof value === 'string' ? value.split(',').map(Number) : value as number[]
    );
  };

  // 分页处理
  const handleChangePage = (event: unknown, newPage: number) => {
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: React.ChangeEvent<HTMLInputElement>) => {
    setRowsPerPage(parseInt(event.target.value, 10));
    setPage(0);
  };

  return (
    <Box>
      <Typography variant="h4" sx={{ fontWeight: 800, mb: 4, color: '#5d4037', letterSpacing: '-0.5px' }}>
        Company Management
      </Typography>

      {/* --- Filter Bar --- */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, 
          mb: 4, 
          borderRadius: '24px', 
          backgroundColor: 'rgba(255, 253, 245, 0.6)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 115, 85, 0.1)',
          display: 'flex',
          gap: 2,
          flexWrap: 'wrap',
          alignItems: 'center'
        }}
      >
        <TextField
          placeholder="Search company name..."
          variant="outlined"
          size="small"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ 
            flexGrow: 1, 
            maxWidth: '400px',
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              backgroundColor: '#fff',
              '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' },
              '&:hover fieldset': { borderColor: '#6d8c7d' },
              '&.Mui-focused fieldset': { borderColor: '#6d8c7d' },
            }
          }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon sx={{ color: '#8d6e63' }} />
              </InputAdornment>
            ),
          }}
        />

        <FormControl size="small" sx={{ minWidth: 220 }}>
          <InputLabel id="level-filter-label" sx={{ color: '#8d6e63' }}>Filter by Level</InputLabel>
          <Select
            labelId="level-filter-label"
            multiple
            value={selectedLevels}
            onChange={handleLevelChange}
            input={<OutlinedInput label="Filter by Level" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => (
                  <Chip key={value} label={`Level ${value}`} size="small" sx={{ backgroundColor: '#e0dbd6', color: '#4e342e' }} />
                ))}
              </Box>
            )}
            sx={{
              borderRadius: '50px',
              backgroundColor: '#fff',
              '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 110, 99, 0.2)' },
              '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6d8c7d' },
              '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6d8c7d' },
            }}
          >
            {allLevels.map((lvl) => (
              <MenuItem key={lvl} value={lvl}>
                Level {lvl}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Paper>

      {/* --- Table Area --- */}
      <Paper 
        elevation={0}
        sx={{
          borderRadius: '24px',
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(139, 115, 85, 0.05)',
          overflow: 'hidden',
          border: '1px solid rgba(0,0,0,0.02)'
        }}
      >
        <TableContainer>
          <Table aria-label="companies table">
            <TableHead sx={{ backgroundColor: '#faf9f6' }}>
              <TableRow>
                <TableCell width={50} />
                <TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>NAME</TableCell>
                <TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>LEVEL</TableCell>
                <TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>COUNTRY</TableCell>
                <TableCell align="right" sx={{ color: '#8d6e63', fontWeight: 700 }}>
                  EFFICIENCY (Rev/Emp)
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {companies.length > 0 ? (
                companies.map((company) => (
                  <Row key={company.id} row={company} />
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center" sx={{ py: 10, color: '#aa8e85' }}>
                    <Typography variant="body1">No companies found.</Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* --- Pagination --- */}
        <TablePagination
          rowsPerPageOptions={[10, 25, 50]}
          component="div"
          count={totalCount}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={handleChangePage}
          onRowsPerPageChange={handleChangeRowsPerPage}
          sx={{
            color: '#8d6e63',
            borderTop: '1px solid rgba(0,0,0,0.04)',
            '.MuiTablePagination-select': { color: '#5d4037', fontWeight: 500 },
            '.MuiTablePagination-selectIcon': { color: '#8d6e63' },
            '.MuiTablePagination-actions': { color: '#8d6e63' }
          }}
        />
      </Paper>
    </Box>
  );
}