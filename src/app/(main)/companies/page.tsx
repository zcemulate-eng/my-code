'use client';

import React, { useState, useEffect } from 'react';
import {
	Box, Paper, Typography, TextField, MenuItem, Select, InputLabel,
	FormControl, Chip, Table, TableBody, TableCell, TableContainer,
	TableHead, TableRow, IconButton, Collapse, InputAdornment, OutlinedInput,
	TablePagination, Stack, Button, Drawer, Snackbar, Alert, Grid // 新增引入
} from '@mui/material';
import {
	KeyboardArrowDown as KeyboardArrowDownIcon, KeyboardArrowUp as KeyboardArrowUpIcon,
	Search as SearchIcon, Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon,
	Close as CloseIcon
} from '@mui/icons-material';
import { getCompanies, getCompanyLevels, createCompany, updateCompany, deleteCompany } from '@/app/actions/company';
import { getCurrentUser } from '@/app/actions/auth';

type SelectChangeEvent<T = string> = { target: { value: T } };

interface CompanyData {
	id: number; companyCode: string; name: string; level: number;
	country: string | null; city: string | null; foundedYear: number | null;
	annualRevenue: number; employees: number | null; parentId?: number | null;
}

const formatCurrency = (value: number) => {
	return new Intl.NumberFormat('zh-CN', { style: 'currency', currency: 'CNY', maximumFractionDigits: 0 }).format(value);
};

// --- 子组件：可折叠的行 (Row) ---
function Row({ row, canManage, onEdit, onDelete }: { row: CompanyData, canManage: boolean, onEdit: (r: CompanyData) => void, onDelete: (id: number) => void }) {
	const [open, setOpen] = useState(false);
	const empCount = row.employees || 0;
	const efficiency = empCount > 0 ? row.annualRevenue / empCount : 0;

	// 动态背景色逻辑 (热力图效果) - 已根据真实 0110 数据的百分位数重新调整
	const getEfficiencyColor = (val: number) => {
		if (val > 1000) return 'rgba(109, 140, 125, 0.4)'; // 深绿 (极高, 约前10%的头部企业)
		if (val > 500) return 'rgba(109, 140, 125, 0.2)';  // 浅绿 (较高, 约排名前25%)
		if (val > 250) return 'rgba(255, 253, 245, 0.5)';  // 米色 (正常水平, 中位数以上)
		return 'rgba(255, 171, 145, 0.2)';                 // 淡红 (偏低, 处于后50%)
	};

	return (
		<React.Fragment>
			<TableRow sx={{ '& > *': { borderBottom: 'unset' }, backgroundColor: open ? 'rgba(109, 140, 125, 0.05)' : 'inherit' }}>
				<TableCell>
					<IconButton aria-label="expand row" size="small" onClick={() => setOpen(!open)}>
						{open ? <KeyboardArrowUpIcon sx={{ color: '#6d8c7d' }} /> : <KeyboardArrowDownIcon sx={{ color: '#8d6e63' }} />}
					</IconButton>
				</TableCell>
				<TableCell component="th" scope="row" sx={{ fontWeight: 'bold', color: '#5d4037' }}>{row.name}</TableCell>
				<TableCell align="left"><Chip label={`Level ${row.level}`} size="small" sx={{ backgroundColor: '#efebe9', color: '#5d4037', fontWeight: 500 }} /></TableCell>
				<TableCell align="left" sx={{ color: '#637381' }}>{row.country || '-'}</TableCell>
				<TableCell align="right" sx={{ backgroundColor: getEfficiencyColor(efficiency), fontWeight: 'bold', color: '#5d4037' }}>
					{formatCurrency(efficiency)} / emp
				</TableCell>
				{/* 👉 新增：操作列 */}
				{canManage && (
					<TableCell align="right">
						<IconButton size="small" onClick={() => onEdit(row)} sx={{ color: '#6d8c7d' }}><EditIcon fontSize="small" /></IconButton>
						<IconButton size="small" onClick={() => onDelete(row.id)} sx={{ color: '#d32f2f' }}><DeleteIcon fontSize="small" /></IconButton>
					</TableCell>
				)}
			</TableRow>

			<TableRow>
				{/* @ts-expect-error: MUI React 19 compatibility */}
				<TableCell sx={{ paddingBottom: 0, paddingTop: 0 }} colSpan={canManage ? 6 : 5}>
					{/* @ts-expect-error: MUI React 19 compatibility */}
					<Collapse in={open} timeout="auto" unmountOnExit>
						<Box sx={{ margin: 2, ml: 8, p: 3, backgroundColor: 'rgba(255,255,255,0.6)', borderRadius: '12px', border: '1px dashed rgba(141, 110, 99, 0.2)' }}>
							<Typography variant="h6" gutterBottom component="div" sx={{ fontSize: '0.9rem', fontWeight: 700, color: '#6d8c7d', mb: 2 }}>详细数据 (Details)</Typography>
							<Box sx={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 3 }}>
								<div><Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>编号 (Code)</Typography><Typography variant="body2" sx={{ fontWeight: 600 }}>{row.companyCode}</Typography></div>
								<div><Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>城市 (City)</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{row.city || '-'}</Typography></div>
								<div><Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>创始年份 (Founded)</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{row.foundedYear || '-'}</Typography></div>
								<div><Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>年营收 (Revenue)</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{formatCurrency(row.annualRevenue)}</Typography></div>
								<div><Typography variant="caption" sx={{ color: '#8d6e63', display: 'block', mb: 0.5 }}>员工数 (Employees)</Typography><Typography variant="body2" sx={{ fontWeight: 500 }}>{empCount.toLocaleString()}</Typography></div>
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
	const [currentUser, setCurrentUser] = useState<any>(null);
	const [companies, setCompanies] = useState<CompanyData[]>([]);
	const [allLevels, setAllLevels] = useState<number[]>([]);

	// 筛选与分页状态
	const [searchName, setSearchName] = useState('');
	const [selectedLevels, setSelectedLevels] = useState<number[]>([]);
	const [page, setPage] = useState(0);
	const [rowsPerPage, setRowsPerPage] = useState(10);
	const [totalCount, setTotalCount] = useState(0);

	// 抽屉与表单状态
	const [drawerOpen, setDrawerOpen] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [formData, setFormData] = useState({ companyCode: '', name: '', level: '', country: '', city: '', foundedYear: '', annualRevenue: '', employees: '', parentId: '' });
	const [toast, setToast] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

	// 初始化与权限获取
	useEffect(() => {
		getCurrentUser().then(res => { if (res.success) setCurrentUser(res.data); });
		getCompanyLevels().then(setAllLevels);
	}, []);

	const canManage = currentUser?.role === 'Admin' || currentUser?.role === 'Manager';

	useEffect(() => { setPage(0); }, [searchName, selectedLevels]);

	useEffect(() => {
		const timer = setTimeout(() => { fetchData(); }, 300);
		return () => clearTimeout(timer);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchName, selectedLevels, page, rowsPerPage]);

	const fetchData = async () => {
		const result = await getCompanies({ search: searchName, levels: selectedLevels, page: page + 1, pageSize: rowsPerPage });
		if (result.success) { setCompanies(result.data as CompanyData[]); setTotalCount(result.total || 0); }
	};

	// --- 增删改事件处理 ---
	const handleOpenDrawer = (company?: CompanyData) => {
		if (company) {
			setEditingId(company.id);
			setFormData({
				companyCode: company.companyCode, name: company.name, level: company.level.toString(),
				country: company.country || '', city: company.city || '', foundedYear: company.foundedYear ? company.foundedYear.toString() : '',
				annualRevenue: company.annualRevenue.toString(), employees: company.employees ? company.employees.toString() : '', parentId: company.parentId ? company.parentId.toString() : ''
			});
		} else {
			setEditingId(null);
			setFormData({ companyCode: '', name: '', level: '1', country: '', city: '', foundedYear: '', annualRevenue: '', employees: '', parentId: '' });
		}
		setDrawerOpen(true);
	};

	const handleSave = async () => {
		// 1. 必填项去空格校验
		if (!formData.companyCode.trim() || !formData.name.trim() || !formData.level.toString().trim()) {
			setToast({ open: true, message: '请填写带 * 的必填项，且不能全为空格', type: 'error' });
			return;
		}

		const currentLevel = parseInt(formData.level);
		const hasParentId = !!formData.parentId.toString().trim();

		// 2. 基础数值边界校验
		if (currentLevel < 1) {
			setToast({ open: true, message: '公司层级 (Level) 必须大于等于 1', type: 'error' });
			return;
		}

		if (formData.foundedYear) {
			const year = parseInt(formData.foundedYear);
			const currentYear = new Date().getFullYear();
			if (year < 1800 || year > currentYear) {
				setToast({ open: true, message: `成立年份必须在 1800 ~ ${currentYear} 之间`, type: 'error' });
				return;
			}
		}

		if (formData.annualRevenue && parseInt(formData.annualRevenue) < 0) {
			setToast({ open: true, message: '年营收不能为负数', type: 'error' });
			return;
		}

		if (formData.employees && parseInt(formData.employees) < 0) {
			setToast({ open: true, message: '员工数不能为负数', type: 'error' });
			return;
		}

		// 3. 🌟 核心树状结构逻辑联动校验 🌟
		if (!hasParentId && currentLevel !== 1) {
			setToast({ open: true, message: '缺少父节点：只有 Level 1 的公司可以不填写 Parent ID', type: 'error' });
			return;
		}

		if (hasParentId && currentLevel === 1) {
			setToast({ open: true, message: '层级冲突：Level 1 为顶级公司，不应该填写 Parent ID', type: 'error' });
			return;
		}

		// --- 校验通过，开始请求后端 ---
		let res;
		if (editingId) {
			res = await updateCompany(editingId, formData);
		} else {
			res = await createCompany(formData);
		}

		if (res.success) {
			setToast({ open: true, message: '操作成功', type: 'success' });
			setDrawerOpen(false);
			fetchData();
			getCompanyLevels().then(setAllLevels);
		} else {
			// 展示后端返回的具体错误（如 Code 重复、父节点层级不匹配等）
			setToast({ open: true, message: res.message || '操作失败', type: 'error' });
		}
	};

	const handleDelete = async (id: number) => {
		if (!confirm('确定要删除该公司吗？这可能会影响到数据图表的层级结构！')) return;
		const res = await deleteCompany(id);
		if (res.success) { setToast({ open: true, message: '删除成功', type: 'success' }); fetchData(); }
		else { setToast({ open: true, message: res.message || '删除失败', type: 'error' }); }
	};

	return (
		<Box>
			<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
				<Typography variant="h4" sx={{ fontWeight: 800, color: '#5d4037', letterSpacing: '-0.5px' }}>
					Company Management
				</Typography>
				{canManage && (
					<Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDrawer()} sx={{ bgcolor: '#6d8c7d', borderRadius: '8px', boxShadow: '0 8px 16px rgba(109, 140, 125, 0.24)', '&:hover': { bgcolor: '#5a7568' } }}>
						Add Company
					</Button>
				)}
			</Stack>

			{/* Filter Bar (与原来完全相同) */}
			<Paper elevation={0} sx={{ p: 3, mb: 4, borderRadius: '24px', backgroundColor: 'rgba(255, 253, 245, 0.6)', backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 115, 85, 0.1)', display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center' }}>
				<TextField id="company-search-input" placeholder="Search company name..." variant="outlined" size="small" value={searchName} onChange={(e: any) => setSearchName(e.target.value)} sx={{ flexGrow: 1, maxWidth: '400px', '& .MuiOutlinedInput-root': { borderRadius: '50px', backgroundColor: '#fff' } }} InputProps={{ startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#8d6e63' }} /></InputAdornment> }} />
				<FormControl size="small" sx={{ minWidth: 220 }}>
					<InputLabel id="level-filter-label" sx={{ color: '#8d6e63' }}>Filter by Level</InputLabel>
					{/* @ts-expect-error: MUI Select React 19 compatibility */}
					<Select labelId="level-filter-label" id="level-filter-select" multiple value={selectedLevels} onChange={(e) => setSelectedLevels(e.target.value as number[])} input={<OutlinedInput label="Filter by Level" />} renderValue={(selected: number[]) => (<Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>{selected.map((value: number) => (<Chip key={value} label={`Level ${value}`} size="small" sx={{ backgroundColor: '#e0dbd6', color: '#4e342e' }} />))}</Box>)} sx={{ borderRadius: '50px', backgroundColor: '#fff' }}>
						{allLevels.map((lvl) => (<MenuItem key={lvl} value={lvl} sx={{ borderRadius: "10px" }}>Level {lvl}</MenuItem>))}
					</Select>
				</FormControl>
			</Paper>

			{/* Table Area */}
			<Paper elevation={0} sx={{ borderRadius: '24px', backgroundColor: '#fff', boxShadow: '0 4px 20px rgba(139, 115, 85, 0.05)', overflow: 'hidden', border: '1px solid rgba(0,0,0,0.02)' }}>
				<TableContainer>
					<Table aria-label="companies table">
						<TableHead sx={{ backgroundColor: '#faf9f6' }}>
							<TableRow>
								<TableCell sx={{ width: 50 }} />
								<TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>NAME</TableCell>
								<TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>LEVEL</TableCell>
								<TableCell sx={{ color: '#8d6e63', fontWeight: 700 }}>COUNTRY</TableCell>
								<TableCell align="right" sx={{ color: '#8d6e63', fontWeight: 700 }}>EFFICIENCY (Rev/Emp)</TableCell>
								{canManage && <TableCell align="right" sx={{ color: '#8d6e63', fontWeight: 700 }}>ACTIONS</TableCell>}
							</TableRow>
						</TableHead>
						<TableBody>
							{companies.length > 0 ? (companies.map((company) => (
								<Row key={company.id} row={company} canManage={canManage} onEdit={handleOpenDrawer} onDelete={handleDelete} />
							))) : (
								<TableRow>
									{/* @ts-expect-error: MUI React 19 compatibility */}
									<TableCell colSpan={canManage ? 6 : 5} align="center" sx={{ py: 10, color: '#aa8e85' }}><Typography variant="body1">No companies found.</Typography></TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
				<TablePagination
					id="companies-table-pagination" SelectProps={{ id: "companies-table-pagination-select" }} rowsPerPageOptions={[10, 25, 50]} component="div"
					count={totalCount} rowsPerPage={rowsPerPage} page={page} onPageChange={(e: unknown, p: number) => setPage(p)}
					onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
					sx={{ color: '#8d6e63', borderTop: '1px solid rgba(0,0,0,0.04)' }}
				/>
			</Paper>

			{/* --- 抽屉：新增/编辑 公司 --- */}
			<Drawer anchor="right" open={drawerOpen} onClose={() => setDrawerOpen(false)} PaperProps={{ sx: { width: { xs: '100%', sm: 500 }, p: 4, backgroundColor: '#faf9f6' } }}>
				<Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
					<Typography variant="h6" sx={{ fontWeight: 800, color: '#5d4037' }}>{editingId ? 'Edit Company' : 'Add New Company'}</Typography>
					<IconButton onClick={() => setDrawerOpen(false)} size="small"><CloseIcon /></IconButton>
				</Box>
				<Grid container spacing={2}>
					<Grid size={{ xs: 6 }}><TextField id="comp-code" label="Company Code *" size="small" fullWidth value={formData.companyCode} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, companyCode: e.target.value })} sx={{ bgcolor: '#fff' }} disabled={!!editingId} helperText="系统唯一标识" /></Grid>
					<Grid size={{ xs: 6 }}><TextField id="comp-level" label="Level *" type="number" size="small" fullWidth value={formData.level} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, level: e.target.value })} sx={{ bgcolor: '#fff' }} helperText="1代表顶层节点" /></Grid>
					<Grid size={{ xs: 12 }}><TextField id="comp-name" label="Company Name *" size="small" fullWidth value={formData.name} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, name: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 6 }}><TextField id="comp-country" label="Country" size="small" fullWidth value={formData.country} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, country: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 6 }}><TextField id="comp-city" label="City" size="small" fullWidth value={formData.city} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, city: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 12 }}><TextField id="comp-founded" label="Founded Year" type="number" size="small" fullWidth value={formData.foundedYear} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, foundedYear: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 6 }}><TextField id="comp-revenue" label="Annual Revenue (¥)" type="number" size="small" fullWidth value={formData.annualRevenue} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, annualRevenue: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 6 }}><TextField id="comp-employees" label="Employees" type="number" size="small" fullWidth value={formData.employees} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, employees: e.target.value })} sx={{ bgcolor: '#fff' }} /></Grid>
					<Grid size={{ xs: 12 }}><TextField id="comp-parent" label="Parent ID (可选)" type="number" size="small" fullWidth value={formData.parentId} onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, parentId: e.target.value })} sx={{ bgcolor: '#fff' }} helperText="关联的父公司数据库 ID（用于气泡图树状结构）" /></Grid>
				</Grid>

				<Stack direction="row" spacing={2} sx={{ mt: 5 }}>
					<Button fullWidth onClick={() => setDrawerOpen(false)} variant="outlined" sx={{ color: '#5d4037', borderColor: 'rgba(139, 115, 85, 0.3)' }}>Cancel</Button>
					<Button fullWidth onClick={handleSave} variant="contained" sx={{ bgcolor: '#6d8c7d', '&:hover': { bgcolor: '#5a7568' } }}>Save Company</Button>
				</Stack>
			</Drawer>

			<Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
				{/* @ts-expect-error: Known type issue with MUI Alert and React 19 */}
				<Alert severity={toast.type} sx={{ borderRadius: '12px' }}>{toast.message}</Alert>
			</Snackbar>
		</Box>
	);
}