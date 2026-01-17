'use client';

import React, { useState, useEffect } from 'react';
import {
  Box, Paper, Typography, TextField, Button, Table, TableBody, TableCell,
  TableContainer, TableHead, TableRow, TablePagination, Checkbox,
  IconButton, Chip, Drawer, MenuItem, InputAdornment, Stack,
  Select, InputLabel, FormControl, OutlinedInput, SelectChangeEvent
} from '@mui/material';
import {
  Add as AddIcon,
  Edit as EditIcon,
  Delete as DeleteIcon,
  Search as SearchIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { 
  getUsers, deleteUser, deleteUsers, getUserRoles, 
  createUser, updateUser, type CreateUserDTO 
} from '@/app/actions/user';

// --- 类型定义 ---
interface UserData {
  id: number;
  name: string | null;
  email: string;
  role: string;
  status: string;
}

// --- 子组件：用户表单抽屉 (Add/Edit 共用) ---
interface UserDrawerProps {
  open: boolean;
  mode: 'add' | 'edit';
  initialData?: UserData | null;
  onClose: () => void;
  onSubmit: () => void;
}

function UserDrawer({ open, mode, initialData, onClose, onSubmit }: UserDrawerProps) {
  // 表单状态
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'User',
    status: 'Active'
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // 当打开或模式改变时，重置表单
  useEffect(() => {
    if (open) {
      setError('');
      if (mode === 'edit' && initialData) {
        setFormData({
          name: initialData.name || '',
          email: initialData.email,
          role: initialData.role,
          status: initialData.status
        });
      } else {
        setFormData({ name: '', email: '', role: 'User', status: 'Active' });
      }
    }
  }, [open, mode, initialData]);

  const handleSubmit = async () => {
    setLoading(true);
    setError('');
    let res;

    if (mode === 'add') {
      res = await createUser(formData);
    } else if (mode === 'edit' && initialData) {
      res = await updateUser({ id: initialData.id, ...formData });
    }

    setLoading(false);

    if (res?.success) {
      onSubmit(); // 刷新父页面数据
      onClose();  // 关闭抽屉
    } else {
      setError(res?.error || 'Operation failed');
    }
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: { width: { xs: '100%', sm: 400 }, p: 4, backgroundColor: '#faf9f6' }
      }}
    >
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
        <Typography variant="h5" sx={{ fontWeight: 800, color: '#5d4037' }}>
          {mode === 'add' ? 'New User' : 'Edit User'}
        </Typography>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <Stack spacing={3}>
        <TextField
          label="Full Name"
          fullWidth
          value={formData.name}
          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#6d8c7d' } }}
        />
        <TextField
          label="Email Address"
          fullWidth
          value={formData.email}
          onChange={(e) => setFormData({ ...formData, email: e.target.value })}
          disabled={mode === 'edit'} // 编辑模式下通常不允许修改 ID/Email
          helperText={mode === 'edit' ? "Email cannot be changed" : ""}
          sx={{ '& .MuiOutlinedInput-root.Mui-focused fieldset': { borderColor: '#6d8c7d' } }}
        />
        
        <FormControl fullWidth>
          <InputLabel>Role</InputLabel>
          <Select
            value={formData.role}
            label="Role"
            onChange={(e) => setFormData({ ...formData, role: e.target.value })}
          >
            <MenuItem value="Admin">Admin</MenuItem>
            <MenuItem value="Manager">Manager</MenuItem>
            <MenuItem value="User">User</MenuItem>
          </Select>
        </FormControl>

        <FormControl fullWidth>
          <InputLabel>Status</InputLabel>
          <Select
            value={formData.status}
            label="Status"
            onChange={(e) => setFormData({ ...formData, status: e.target.value })}
          >
            <MenuItem value="Active">Active</MenuItem>
            <MenuItem value="Disabled">Disabled</MenuItem>
            <MenuItem value="Pending">Pending</MenuItem>
          </Select>
        </FormControl>

        {error && (
          <Typography color="error" variant="body2">{error}</Typography>
        )}

        <Box sx={{ mt: 4, display: 'flex', gap: 2, justifyContent: 'flex-end' }}>
          <Button variant="outlined" onClick={onClose} sx={{ color: '#8d6e63', borderColor: '#8d6e63' }}>
            Cancel
          </Button>
          <Button 
            variant="contained" 
            onClick={handleSubmit}
            disabled={loading}
            sx={{ backgroundColor: '#6d8c7d', '&:hover': { backgroundColor: '#5a7568' } }}
          >
            {loading ? 'Saving...' : (mode === 'add' ? 'Create User' : 'Save Changes')}
          </Button>
        </Box>
      </Stack>
    </Drawer>
  );
}

// --- 主页面组件 ---
export default function UsersPage() {
  const [users, setUsers] = useState<UserData[]>([]);
  const [total, setTotal] = useState(0);

  // 筛选与分页
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [searchName, setSearchName] = useState('');
  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [allRoles, setAllRoles] = useState<string[]>([]);

  // 多选状态
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  // 抽屉状态
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [drawerMode, setDrawerMode] = useState<'add' | 'edit'>('add');
  const [editTarget, setEditTarget] = useState<UserData | null>(null);

  // 初始化
  useEffect(() => {
    loadRoles();
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 监听筛选变动 (防抖)
  useEffect(() => {
    const timer = setTimeout(() => {
      setPage(0); // 重置到第一页
      fetchData();
    }, 300);
    return () => clearTimeout(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchName, selectedRoles]);

  // 监听分页变动
  useEffect(() => {
    fetchData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, rowsPerPage]);

  const loadRoles = async () => {
    const roles = await getUserRoles();
    setAllRoles(roles);
  };

  const fetchData = async () => {
    const res = await getUsers({
      page: page + 1,
      pageSize: rowsPerPage,
      search: searchName,
      roles: selectedRoles
    });
    if (res.success) {
      setUsers(res.data as UserData[]);
      setTotal(res.total || 0);
    }
  };

  // --- 事件处理 ---

  const handleOpenAdd = () => {
    setDrawerMode('add');
    setEditTarget(null);
    setDrawerOpen(true);
  };

  const handleOpenEdit = (user: UserData) => {
    setDrawerMode('edit');
    setEditTarget(user);
    setDrawerOpen(true);
  };

  const handleDeleteOne = async (id: number) => {
    if (confirm('Are you sure you want to delete this user?')) {
      await deleteUser(id);
      fetchData();
    }
  };

  const handleBulkDelete = async () => {
    if (confirm(`Are you sure you want to delete ${selectedIds.length} users?`)) {
      await deleteUsers(selectedIds);
      setSelectedIds([]); // 清空选中
      fetchData();
    }
  };

  const handleSelectAll = (event: React.ChangeEvent<HTMLInputElement>) => {
    if (event.target.checked) {
      const newSelected = users.map((n) => n.id);
      setSelectedIds(newSelected);
      return;
    }
    setSelectedIds([]);
  };

  // 修复点：移除了 MouseEvent 类型，使用 _event 忽略参数，解决 TS 报错
  const handleClick = (_event: unknown, id: number) => {
    const selectedIndex = selectedIds.indexOf(id);
    let newSelected: number[] = [];

    if (selectedIndex === -1) {
      newSelected = newSelected.concat(selectedIds, id);
    } else if (selectedIndex === 0) {
      newSelected = newSelected.concat(selectedIds.slice(1));
    } else if (selectedIndex === selectedIds.length - 1) {
      newSelected = newSelected.concat(selectedIds.slice(0, -1));
    } else if (selectedIndex > 0) {
      newSelected = newSelected.concat(
        selectedIds.slice(0, selectedIndex),
        selectedIds.slice(selectedIndex + 1),
      );
    }
    setSelectedIds(newSelected);
  };

  // 状态颜色 Helper
  const getStatusColor = (status: string) => {
    if (status === 'Active') return 'success';
    if (status === 'Disabled') return 'default';
    if (status === 'Pending') return 'warning';
    return 'default';
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 4, alignItems: 'center' }}>
        <Typography variant="h4" sx={{ fontWeight: 800, color: '#5d4037', letterSpacing: '-0.5px' }}>
          User Management
        </Typography>
        <Button 
          variant="contained" 
          startIcon={<AddIcon />}
          onClick={handleOpenAdd}
          sx={{ 
            backgroundColor: '#6d8c7d', 
            borderRadius: '50px',
            textTransform: 'none',
            '&:hover': { backgroundColor: '#5a7568' }
          }}
        >
          Add New User
        </Button>
      </Box>

      {/* --- Filter Bar --- */}
      <Paper 
        elevation={0}
        sx={{ 
          p: 3, mb: 4, borderRadius: '24px', 
          backgroundColor: 'rgba(255, 253, 245, 0.6)', 
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(139, 115, 85, 0.1)',
          display: 'flex', gap: 2, alignItems: 'center', flexWrap: 'wrap'
        }}
      >
        <TextField
          placeholder="Search name or email..."
          size="small"
          value={searchName}
          onChange={(e) => setSearchName(e.target.value)}
          sx={{ 
            flexGrow: 1, 
            maxWidth: 400,
            '& .MuiOutlinedInput-root': {
              borderRadius: '50px',
              backgroundColor: '#fff',
              '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' },
              '&:hover fieldset': { borderColor: '#6d8c7d' },
              '&.Mui-focused fieldset': { borderColor: '#6d8c7d' },
            }
          }}
          InputProps={{
            startAdornment: <InputAdornment position="start"><SearchIcon sx={{color:'#8d6e63'}}/></InputAdornment>
          }}
        />

        <FormControl size="small" sx={{ minWidth: 200 }}>
          <InputLabel id="role-select-label" sx={{ color: '#8d6e63' }}>Filter by Role</InputLabel>
          <Select
            labelId="role-select-label"
            multiple
            value={selectedRoles}
            onChange={(e) => setSelectedRoles(typeof e.target.value === 'string' ? e.target.value.split(',') : e.target.value as string[])}
            input={<OutlinedInput label="Filter by Role" />}
            renderValue={(selected) => (
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
                {selected.map((value) => <Chip key={value} label={value} size="small" sx={{ backgroundColor: '#e0dbd6' }} />)}
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
            {allRoles.map((role) => (
              <MenuItem key={role} value={role}>{role}</MenuItem>
            ))}
          </Select>
        </FormControl>

        {selectedIds.length > 0 && (
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<DeleteIcon />}
            onClick={handleBulkDelete}
            sx={{ borderRadius: '50px', ml: 'auto', fontWeight: 'bold' }}
          >
            Delete ({selectedIds.length})
          </Button>
        )}
      </Paper>

      {/* --- Table --- */}
      <Paper 
        elevation={0}
        sx={{ 
          borderRadius: '24px', 
          overflow: 'hidden', 
          backgroundColor: '#fff',
          boxShadow: '0 4px 20px rgba(139, 115, 85, 0.05)',
          border: '1px solid rgba(0,0,0,0.02)'
        }}
      >
        <TableContainer>
          <Table>
            <TableHead sx={{ backgroundColor: '#faf9f6' }}>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox 
                    color="primary"
                    indeterminate={selectedIds.length > 0 && selectedIds.length < users.length}
                    checked={users.length > 0 && selectedIds.length === users.length}
                    onChange={handleSelectAll}
                    sx={{ color: '#8d6e63', '&.Mui-checked': { color: '#6d8c7d' } }}
                  />
                </TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8d6e63' }}>NAME</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8d6e63' }}>EMAIL</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8d6e63' }}>ROLE</TableCell>
                <TableCell sx={{ fontWeight: 700, color: '#8d6e63' }}>STATUS</TableCell>
                <TableCell align="right" sx={{ fontWeight: 700, color: '#8d6e63' }}>ACTIONS</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => {
                const isSelected = selectedIds.indexOf(user.id) !== -1;
                return (
                  <TableRow 
                    key={user.id} 
                    hover 
                    role="checkbox"
                    selected={isSelected}
                    sx={{ '&.Mui-selected': { backgroundColor: 'rgba(109, 140, 125, 0.08) !important' } }}
                  >
                    <TableCell padding="checkbox">
                      <Checkbox 
                        color="primary"
                        checked={isSelected}
                        onChange={(event) => handleClick(event, user.id)}
                        sx={{ color: '#8d6e63', '&.Mui-checked': { color: '#6d8c7d' } }}
                      />
                    </TableCell>
                    <TableCell sx={{ fontWeight: 600, color: '#5d4037' }}>{user.name || '-'}</TableCell>
                    <TableCell sx={{ color: '#637381' }}>{user.email}</TableCell>
                    <TableCell>
                      <Chip 
                        label={user.role} 
                        size="small" 
                        sx={{ bgcolor: '#efebe9', color: '#5d4037', fontWeight: 500 }} 
                      />
                    </TableCell>
                    <TableCell>
                      <Chip 
                        label={user.status} 
                        size="small" 
                        color={getStatusColor(user.status) as any} 
                        variant="outlined" 
                        sx={{ fontWeight: 500 }}
                      />
                    </TableCell>
                    <TableCell align="right">
                      <IconButton size="small" onClick={() => handleOpenEdit(user)} sx={{ color: '#6d8c7d', mr: 1 }}>
                        <EditIcon />
                      </IconButton>
                      <IconButton size="small" onClick={() => handleDeleteOne(user.id)} sx={{ color: '#ff8a65' }}>
                        <DeleteIcon />
                      </IconButton>
                    </TableCell>
                  </TableRow>
                );
              })}
              {users.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} align="center" sx={{ py: 8, color: '#aa8e85' }}>
                    No users found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <TablePagination
          component="div"
          count={total}
          rowsPerPage={rowsPerPage}
          page={page}
          onPageChange={(e, p) => setPage(p)}
          onRowsPerPageChange={(e) => {
            setRowsPerPage(parseInt(e.target.value, 10));
            setPage(0);
          }}
          sx={{
            color: '#8d6e63',
            '.MuiTablePagination-select': { color: '#5d4037' }
          }}
        />
      </Paper>

      {/* --- Drawer (抽屉：用于添加和编辑) --- */}
      <UserDrawer 
        open={drawerOpen}
        mode={drawerMode}
        initialData={editTarget}
        onClose={() => setDrawerOpen(false)}
        onSubmit={fetchData} // 提交成功后重新加载列表
      />
    </Box>
  );
}