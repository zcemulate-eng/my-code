// src/app/(main)/users/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
    Box, Typography, Paper, Table, TableBody, TableCell, TableContainer,
    TableHead, TableRow, Button, IconButton, Chip, Drawer, TextField, MenuItem,
    Stack, Snackbar, Alert, TablePagination, InputAdornment, FormControl,
    InputLabel, Select, OutlinedInput
} from '@mui/material';
import {
    Edit as EditIcon, Delete as DeleteIcon, Add as AddIcon,
    Search as SearchIcon, Close as CloseIcon
} from '@mui/icons-material';

import { getUsers, createUser, updateUser, deleteUser, getUserRoles } from '@/app/actions/user';
import { getCurrentUser } from '@/app/actions/auth';

export default function UsersPage() {
    // --- 状态管理 ---
    const [currentUser, setCurrentUser] = useState<any>(null);
    const [users, setUsers] = useState<any[]>([]);
    const [total, setTotal] = useState(0);
    const [page, setPage] = useState(0);
    const [rowsPerPage, setRowsPerPage] = useState(10);

    // 过滤状态
    const [searchName, setSearchName] = useState('');
    const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
    const [allRoles, setAllRoles] = useState<string[]>(['Admin', 'Manager', 'User']);

    // 抽屉状态
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [editingId, setEditingId] = useState<number | null>(null);
    const [formData, setFormData] = useState({ name: '', email: '', password: '', role: 'User', status: 'Active' });

    // 👇 新增：表单验证错误状态
    const [errors, setErrors] = useState({ name: '', email: '', password: '' });

    // 提示状态
    const [toast, setToast] = useState({ open: false, message: '', type: 'success' as 'success' | 'error' });

    // --- 初始化权限与动态角色列表 ---
    useEffect(() => {
        const initData = async () => {
            const userRes = await getCurrentUser();
            if (userRes.success) setCurrentUser(userRes.data);

            const roles = await getUserRoles();
            if (roles.length > 0) setAllRoles(roles);
        };
        initData();
    }, []);

    // --- 监听过滤与分页参数，带防抖的请求 ---
    useEffect(() => {
        const timer = setTimeout(() => {
            fetchUsers();
        }, 300); // 300ms防抖
        return () => clearTimeout(timer);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [searchName, selectedRoles, page, rowsPerPage]);

    // 重置页码
    useEffect(() => {
        setPage(0);
    }, [searchName, selectedRoles]);

    const fetchUsers = async () => {
        const res = await getUsers({
            search: searchName,
            roles: selectedRoles,
            page: page + 1,
            pageSize: rowsPerPage
        });
        if (res.success) {
            setUsers(res.data);
            setTotal(res.total);
        }
    };

    // --- 权限计算器 ---
    const isAdmin = currentUser?.role === 'Admin';
    const isManager = currentUser?.role === 'Manager';

    const canAddUser = isAdmin || isManager;
    const canOperateRow = (targetRole: string) => {
        if (isAdmin) return targetRole !== 'Admin';
        if (isManager) return targetRole === 'User';
        return false;
    };

    // --- 事件处理 ---
    const handleOpenDrawer = (user?: any) => {
        // 清空上次的错误提示
        setErrors({ name: '', email: '', password: '' });

        if (user) {
            setEditingId(user.id);
            setFormData({ name: user.name || '', email: user.email, password: '', role: user.role, status: user.status });
        } else {
            setEditingId(null);
            setFormData({ name: '', email: '', password: '', role: 'User', status: 'Active' });
        }
        setDrawerOpen(true);
    };

    // 👇 新增：前端表单校验
    const validateForm = () => {
        let isValid = true;
        const newErrors = { name: '', email: '', password: '' };

        if (!formData.name.trim()) {
            newErrors.name = "姓名为必填项";
            isValid = false;
        }
        if (!formData.email.trim()) {
            newErrors.email = "邮箱为必填项";
            isValid = false;
        } else if (!formData.email.includes('@')) {
            newErrors.email = "邮箱格式不正确";
            isValid = false;
        }
        // 新增用户时，密码必填；编辑用户时，密码可以为空（留空代表不修改）
        if (!editingId && !formData.password) {
            newErrors.password = "初始密码为必填项";
            isValid = false;
        } else if (formData.password && formData.password.length < 6) {
            newErrors.password = "密码至少需要 6 位";
            isValid = false;
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSave = async () => {
        // 校验拦截
        if (!validateForm()) return;

        let res;
        if (editingId) {
            const { password, ...updateData } = formData;
            res = await updateUser({ id: editingId, ...updateData, ...(password ? { password } : {}) });
        } else {
            res = await createUser(formData);
        }

        if (res.success) {
            setToast({ open: true, message: '操作成功', type: 'success' });
            setDrawerOpen(false);
            fetchUsers();
        } else {
            // 兼容可能返回的 res.message 或者 res.error
            setToast({ open: true, message: res.error || res.message || '操作失败', type: 'error' });
        }
    };

    const handleDelete = async (id: number) => {
        if (!confirm('确定要删除该用户吗？')) return;
        const res = await deleteUser(id);
        if (res.success) {
            setToast({ open: true, message: '删除成功', type: 'success' });
            fetchUsers();
        } else {
            setToast({ open: true, message: '删除失败', type: 'error' });
        }
    };

    return (
        <Box>
            {/* 顶部标题与操作区 */}
            <Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#5d4037', letterSpacing: '-0.5px' }}>
                    User Management
                </Typography>

                {canAddUser && (
                    <Button
                        variant="contained"
                        startIcon={<AddIcon />}
                        onClick={() => handleOpenDrawer()}
                        sx={{
                            bgcolor: '#6d8c7d', borderRadius: '8px',
                            boxShadow: '0 8px 16px rgba(109, 140, 125, 0.24)',
                            '&:hover': { bgcolor: '#5a7568', boxShadow: '0 8px 16px rgba(109, 140, 125, 0.4)' }
                        }}
                    >
                        Add User
                    </Button>
                )}
            </Stack>

            {/* --- Filter Bar --- */}
            <Paper
                elevation={0}
                sx={{
                    p: 3, mb: 4, borderRadius: '24px', backgroundColor: 'rgba(255, 253, 245, 0.6)',
                    backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 115, 85, 0.1)',
                    display: 'flex', gap: 2, flexWrap: 'wrap', alignItems: 'center'
                }}
            >
                <TextField
                    id="search-user-input"
                    placeholder="Search by name or email..."
                    variant="outlined"
                    size="small"
                    value={searchName}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchName(e.target.value)}
                    sx={{
                        flexGrow: 1, maxWidth: '400px',
                        '& .MuiOutlinedInput-root': {
                            borderRadius: '50px', backgroundColor: '#fff',
                            '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' },
                            '&:hover fieldset': { borderColor: '#6d8c7d' },
                            '&.Mui-focused fieldset': { borderColor: '#6d8c7d' },
                        }
                    }}
                    slotProps={{
                        input: { startAdornment: <InputAdornment position="start"><SearchIcon sx={{ color: '#8d6e63' }} /></InputAdornment> }
                    }}
                />

                <FormControl size="small" sx={{ minWidth: 220 }}>
                    <InputLabel id="role-filter-label" sx={{ color: '#8d6e63' }}>Filter by Role</InputLabel>
                    {/* @ts-expect-error: MUI Select React 19 compatibility */}
                    <Select
                        labelId="role-filter-label"
                        id="role-filter-select"
                        multiple
                        value={selectedRoles}
                        onChange={(e: { target: { value: string | string[] } }) => setSelectedRoles(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
                        input={<OutlinedInput label="Filter by Role" />}
                        renderValue={(selected: string[]) => (
                            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                                {selected.map((value: string) => (
                                    <Chip key={value} label={value} size="small" sx={{ backgroundColor: '#e0dbd6', color: '#4e342e' }} />
                                ))}
                            </Box>
                        )}
                        sx={{
                            borderRadius: '50px', backgroundColor: '#fff',
                            '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 110, 99, 0.2)' },
                            '&:hover .MuiOutlinedInput-notchedOutline': { borderColor: '#6d8c7d' },
                            '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#6d8c7d' },
                        }}
                    >
                        {allRoles.map((role) => (
                            <MenuItem key={role} value={role} sx={{ borderRadius: "10px", mx: 1 }}>
                                {role}
                            </MenuItem>
                        ))}
                    </Select>
                </FormControl>
            </Paper>

            {/* --- 表格区 --- */}
            <Paper elevation={0} sx={{ borderRadius: '24px', border: '1px solid rgba(0,0,0,0.02)', boxShadow: '0 4px 20px rgba(139, 115, 85, 0.05)', overflow: 'hidden' }}>
                <TableContainer>
                    <Table>
                        <TableHead sx={{ bgcolor: '#faf9f6' }}>
                            <TableRow>
                                <TableCell sx={{ fontWeight: 'bold', color: '#8d6e63' }}>NAME</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#8d6e63' }}>EMAIL</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#8d6e63' }}>ROLE</TableCell>
                                <TableCell sx={{ fontWeight: 'bold', color: '#8d6e63' }}>STATUS</TableCell>
                                {canAddUser && <TableCell align="right" sx={{ fontWeight: 'bold', color: '#8d6e63' }}>ACTIONS</TableCell>}
                            </TableRow>
                        </TableHead>
                        <TableBody>
                            {users.length > 0 ? users.map((row) => (
                                <TableRow key={row.id} hover>
                                    <TableCell sx={{ fontWeight: 600, color: '#5d4037' }}>{row.name || '-'}</TableCell>
                                    <TableCell sx={{ color: '#637381' }}>{row.email}</TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.role}
                                            size="small"
                                            sx={{
                                                bgcolor: row.role === 'Admin' ? '#ffebee' : row.role === 'Manager' ? '#fff3e0' : '#e8f5e9',
                                                color: row.role === 'Admin' ? '#c62828' : row.role === 'Manager' ? '#ef6c00' : '#2e7d32',
                                                fontWeight: 'bold'
                                            }}
                                        />
                                    </TableCell>
                                    <TableCell>
                                        <Chip
                                            label={row.status} size="small" variant="outlined"
                                            color={row.status === 'Active' ? 'success' : 'default'}
                                        />
                                    </TableCell>

                                    {canAddUser && (
                                        <TableCell align="right">
                                            {canOperateRow(row.role) ? (
                                                <>
                                                    <IconButton size="small" onClick={() => handleOpenDrawer(row)} sx={{ color: '#6d8c7d' }}>
                                                        <EditIcon fontSize="small" />
                                                    </IconButton>
                                                    <IconButton size="small" onClick={() => handleDelete(row.id)} sx={{ color: '#d32f2f' }}>
                                                        <DeleteIcon fontSize="small" />
                                                    </IconButton>
                                                </>
                                            ) : (
                                                <Typography variant="caption" color="textSecondary">无权限</Typography>
                                            )}
                                        </TableCell>
                                    )}
                                </TableRow>
                            )) : (
                                <TableRow>
                                    {/* @ts-expect-error: MUI Select React 19 compatibility */}
                                    <TableCell colSpan={canAddUser ? 5 : 4} align="center" sx={{ py: 6, color: '#aa8e85' }}>
                                        No users found.
                                    </TableCell>
                                </TableRow>
                            )}
                        </TableBody>
                    </Table>
                </TableContainer>
                <TablePagination
                    id="users-table-pagination"
                    SelectProps={{ id: "users-table-pagination-select" }}
                    component="div" count={total} page={page} rowsPerPage={rowsPerPage}
                    onPageChange={(e: unknown, newPage: number) => setPage(newPage)}
                    onRowsPerPageChange={(e: React.ChangeEvent<HTMLInputElement>) => { setRowsPerPage(parseInt(e.target.value, 10)); setPage(0); }}
                    sx={{ color: '#8d6e63', borderTop: '1px solid rgba(0,0,0,0.04)' }}
                />
            </Paper>

            {/* --- 抽屉：新增/编辑 --- */}
            <Drawer
                anchor="right"
                open={drawerOpen}
                onClose={() => setDrawerOpen(false)}
                PaperProps={{
                    sx: { width: { xs: '100%', sm: 400 }, p: 3, backgroundColor: '#faf9f6' }
                }}
            >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
                    <Typography variant="h6" sx={{ fontWeight: 800, color: '#5d4037' }}>
                        {editingId ? 'Edit User' : 'Add New User'}
                    </Typography>
                    <IconButton onClick={() => setDrawerOpen(false)} size="small">
                        <CloseIcon />
                    </IconButton>
                </Box>

                <Stack spacing={3} sx={{ flexGrow: 1 }}>
                    <TextField
                        id="user-name"
                        label="Name" size="small" fullWidth
                        value={formData.name}
                        error={!!errors.name}
                        helperText={errors.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFormData({ ...formData, name: e.target.value });
                            if (errors.name) setErrors({ ...errors, name: '' });
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                    />
                    <TextField
                        id="user-email"
                        label="Email" size="small" fullWidth disabled={!!editingId}
                        value={formData.email}
                        error={!!errors.email}
                        helperText={errors.email}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFormData({ ...formData, email: e.target.value });
                            if (errors.email) setErrors({ ...errors, email: '' });
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                    />
                    <TextField
                        id="user-password"
                        label={editingId ? "New Password (leave blank to keep)" : "Password"}
                        type="password" size="small" fullWidth
                        value={formData.password}
                        error={!!errors.password}
                        helperText={errors.password}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                            setFormData({ ...formData, password: e.target.value });
                            if (errors.password) setErrors({ ...errors, password: '' });
                        }}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                    />

                    <TextField
                        id="user-role"
                        select label="Role" size="small" fullWidth value={formData.role}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, role: e.target.value })}
                        disabled={!isAdmin}
                        helperText={!isAdmin && "Manager 只能创建或编辑普通 User"}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                    >
                        {isAdmin && <MenuItem value="Manager">Manager</MenuItem>}
                        <MenuItem value="User">User</MenuItem>
                    </TextField>

                    <TextField
                        id="user-status"
                        select label="Status" size="small" fullWidth value={formData.status}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, status: e.target.value })}
                        sx={{ '& .MuiOutlinedInput-root': { borderRadius: '12px', bgcolor: '#fff' } }}
                    >
                        <MenuItem value="Active">Active</MenuItem>
                        <MenuItem value="Inactive">Inactive</MenuItem>
                    </TextField>
                </Stack>

                <Stack direction="row" spacing={2} sx={{ mt: 4 }}>
                    <Button fullWidth onClick={() => setDrawerOpen(false)} variant="outlined" sx={{ color: '#5d4037', borderColor: 'rgba(139, 115, 85, 0.3)', borderRadius: '12px' }}>
                        Cancel
                    </Button>
                    <Button fullWidth onClick={handleSave} variant="contained" sx={{ bgcolor: '#6d8c7d', borderRadius: '12px', boxShadow: 'none', '&:hover': { bgcolor: '#5a7568' } }}>
                        Save User
                    </Button>
                </Stack>
            </Drawer>

            {/* --- 提示消息 --- */}
            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                {/* @ts-expect-error: Known type issue with MUI Alert and React 19 */}
                <Alert severity={toast.type} sx={{ borderRadius: '12px' }}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}