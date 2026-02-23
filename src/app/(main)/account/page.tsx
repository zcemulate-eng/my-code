// src/app/(main)/account/page.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Box, Card, CardContent, Typography, TextField, Button, 
    Avatar, IconButton, MenuItem, FormControl, 
    Stack, Snackbar, Alert, CircularProgress, Grid 
} from '@mui/material';
import Select from '@mui/material/Select';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import { getCurrentUser, updateAccount } from '@/app/actions/auth'; 

const inputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '8px',
        backgroundColor: '#fff',
        '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' },
        '&:hover fieldset': { borderColor: '#8d6e63' },
        '&.Mui-focused fieldset': { borderColor: '#6d8c7d', borderWidth: '2px' },
    },
    '& .MuiInputBase-input': { color: '#4e342e', fontWeight: 500 }
};

export default function AccountManagementPage() {
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [toast, setToast] = useState({ open: false, message: '', severity: 'success' as 'success' | 'error' });
    
    // 表单状态
    const [formData, setFormData] = useState({
        name: '', email: '', phone: '', gender: '', dob: '', address: '', avatarUrl: ''
    });

    // 错误状态记录（昵称和电话）
    const [errors, setErrors] = useState({
        name: '',
        phone: ''
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const res = await getCurrentUser();
            if (res.success && res.data) {
                setFormData({
                    name: res.data.name || '',
                    email: res.data.email || '',
                    phone: res.data.phone || '',
                    gender: res.data.gender || '',
                    dob: res.data.dob || '',
                    address: res.data.address || '',
                    avatarUrl: res.data.avatarUrl || ''
                });
            }
            setLoading(false);
        };
        fetchUserData();
    }, []);

    const handleChange = (field: string) => (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement> | { target: { value: string } }
) => {
    setFormData(prev => ({ ...prev, [field]: e.target.value }));
    
    if (field === 'name' || field === 'phone') {
        setErrors(prev => ({ ...prev, [field]: '' }));
    }
};

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (ev) => setFormData(prev => ({ ...prev, avatarUrl: ev.target?.result as string }));
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    // 提交前的前端数据校验
    // 提交前的前端数据校验
    const validateForm = () => {
        let isValid = true;
        const newErrors = { name: '', phone: '' };

        // 校验电话：存在才校验
        if (formData.phone) {
            if (formData.phone.charAt(0) !== '1') {
                newErrors.phone = "首位数字要求为 1";
                isValid = false;
            } else if (!/^\d{11}$/.test(formData.phone)) {
                newErrors.phone = "电话号码要求 11 位数字";
                isValid = false;
            }
        }

        setErrors(newErrors);
        return isValid;
    };

    const handleSubmit = async () => {
        if (!validateForm()) return; // 校验不通过直接拦截

        setSaving(true);
        try {
            const result = await updateAccount({
                name: formData.name,
                phone: formData.phone,
                gender: formData.gender,
                dob: formData.dob,
                address: formData.address,
                avatarUrl: formData.avatarUrl
            });
            
            if (result.success) {
                setToast({ open: true, message: result.message || '更新成功', severity: 'success' });
                setTimeout(() => window.location.reload(), 1500);
            } else {
                // 如果后端返回昵称占用，将错误挂载到昵称输入框下方
                if (result.message === "该昵称已被人使用") {
                    setErrors(prev => ({ ...prev, name: result.message }));
                }
                setToast({ open: true, message: result.message || '更新失败', severity: 'error' });
            }
        } catch (error) {
            setToast({ open: true, message: '网络请求错误', severity: 'error' });
        } finally {
            setSaving(false);
        }
    };

    if (loading) {
        return (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '60vh' }}>
                <CircularProgress sx={{ color: '#6d8c7d' }} />
            </Box>
        );
    }

    return (
        <Box sx={{ maxWidth: 1200, margin: '0 auto', pb: 5 }}>
            <Box sx={{ mb: 4 }}>
                <Typography variant="h4" sx={{ fontWeight: 800, color: '#4e342e', mb: 1, letterSpacing: '-0.5px' }}>
                    Account
                </Typography>
                <Typography variant="body2" sx={{ color: '#8d6e63' }}>
                    Dashboard / User / Account
                </Typography>
            </Box>

            <Grid container spacing={4}>
                {/* 左侧区块 (1/3) 头像 */}
                <Grid size={{ xs: 12, md: 4 }}>
                    <Card elevation={0} sx={{ 
                        borderRadius: '16px', p: 4, textAlign: 'center',
                        backgroundColor: 'rgba(255, 255, 255, 0.9)', backdropFilter: 'blur(20px)',
                        border: '1px solid rgba(139, 115, 85, 0.08)', boxShadow: '0 8px 24px rgba(139, 115, 85, 0.04)' 
                    }}>
                        <CardContent sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', p: 0 }}>
                            <Box sx={{ position: 'relative', p: 1, border: '1px dashed rgba(141, 110, 99, 0.3)', borderRadius: '50%', mb: 3 }}>
                                <Avatar 
                                    src={formData.avatarUrl || undefined}
                                    sx={{ width: 140, height: 140, bgcolor: '#efebe9', fontSize: '3rem', color: '#a1887f' }}
                                >
                                    {formData.name ? formData.name.charAt(0).toUpperCase() : 'U'}
                                </Avatar>
                                <IconButton 
                                    component="label" 
                                    sx={{ 
                                        position: 'absolute', bottom: 10, right: 10, bgcolor: '#6d8c7d', color: '#fff', 
                                        border: '3px solid #fff', width: 40, height: 40, '&:hover': { bgcolor: '#5a7568' },
                                        boxShadow: '0 4px 12px rgba(109, 140, 125, 0.4)'
                                    }}
                                >
                                    <PhotoCameraIcon fontSize="small" />
                                    <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                                </IconButton>
                            </Box>
                            <Typography variant="caption" sx={{ color: '#9e9e9e', display: 'block', maxWidth: 200, lineHeight: 1.5 }}>
                                允许格式 *.jpeg, *.jpg, *.png, *.gif <br />最大文件限制 3.1 MB
                            </Typography>
                        </CardContent>
                    </Card>
                </Grid>

                {/* 右侧区块 (2/3) 表单 */}
                <Grid size={{ xs: 12, md: 8 }}>
                    <Card elevation={0} sx={{ 
                        borderRadius: '16px', p: { xs: 3, md: 4 }, backgroundColor: 'rgba(255, 255, 255, 0.9)',
                        backdropFilter: 'blur(20px)', border: '1px solid rgba(139, 115, 85, 0.08)',
                        boxShadow: '0 8px 24px rgba(139, 115, 85, 0.04)' 
                    }}>
                        <CardContent sx={{ p: 0 }}>
                            <Grid container spacing={3}>
                                {/* 登录邮箱放第一 (禁用态) */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        登录邮箱
                                    </Typography>
                                    <TextField 
                                        fullWidth size="small" disabled
                                        value={formData.email} 
                                        sx={{
                                            '& .MuiOutlinedInput-root': {
                                                borderRadius: '8px', backgroundColor: 'rgba(141, 110, 99, 0.05)',
                                                '& fieldset': { borderColor: 'transparent' }, '&.Mui-disabled': { color: '#8d6e63' }
                                            },
                                            '& .MuiInputBase-input.Mui-disabled': { WebkitTextFillColor: '#8d6e63' }
                                        }}
                                    />
                                </Grid>

                                {/* 姓名/昵称放第二 */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        姓名 / 昵称
                                    </Typography>
                                    <TextField 
                                        fullWidth size="small" 
                                        value={formData.name} onChange={handleChange('name')}
                                        error={!!errors.name} helperText={errors.name}
                                        sx={inputSx}
                                    />
                                </Grid>

                                {/* 电话号码 */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        电话号码
                                    </Typography>
                                    <TextField 
                                        fullWidth size="small" 
                                        value={formData.phone} onChange={handleChange('phone')}
                                        error={!!errors.phone} helperText={errors.phone}
                                        sx={inputSx}
                                    />
                                </Grid>

                                {/* 性别 */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        性别
                                    </Typography>
                                    <FormControl fullWidth size="small" sx={inputSx}>
                                        {/* @ts-expect-error: MUI Select React 19 compatibility */}
                                        <Select value={formData.gender} onChange={handleChange('gender')} displayEmpty>
                                            <MenuItem value="" disabled>请选择性别</MenuItem>
                                            <MenuItem value="男">男</MenuItem>
                                            <MenuItem value="女">女</MenuItem>
                                        </Select>
                                    </FormControl>
                                </Grid>

                                {/* 出生年月：唤起浏览器原生日期日历 */}
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        出生年月
                                    </Typography>
                                    <TextField 
                                        fullWidth size="small" 
                                        type="date"
                                        value={formData.dob} onChange={handleChange('dob')}
                                        // 解决日期 placeholder 和文字重叠的问题
                                        InputLabelProps={{ shrink: true }}
                                        sx={inputSx}
                                    />
                                </Grid>

                                {/* 详细地址 */}
                                <Grid size={{ xs: 12 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 1, fontWeight: 'bold' }}>
                                        详细地址
                                    </Typography>
                                    <TextField 
                                        fullWidth size="small" 
                                        value={formData.address} onChange={handleChange('address')}
                                        sx={inputSx}
                                    />
                                </Grid>
                            </Grid>

                            {/* 操作区域 */}
                            <Stack direction="row" justifyContent="flex-end" sx={{ mt: 5 }}>
                                <Button 
                                    variant="contained" onClick={handleSubmit} disabled={saving}
                                    sx={{ 
                                        bgcolor: '#6d8c7d', borderRadius: '8px', px: 4, py: 1.2, fontWeight: 'bold', textTransform: 'none',
                                        boxShadow: '0 8px 16px rgba(109, 140, 125, 0.24)',
                                        '&:hover': { bgcolor: '#5a7568', boxShadow: '0 8px 16px rgba(109, 140, 125, 0.4)' },
                                        '&.Mui-disabled': { bgcolor: '#cfd8d4', color: '#fff' }
                                    }}
                                >
                                    {saving ? 'Saving...' : 'Save Changes'}
                                </Button>
                            </Stack>
                        </CardContent>
                    </Card>
                </Grid>
            </Grid>

            <Snackbar open={toast.open} autoHideDuration={3000} onClose={() => setToast({ ...toast, open: false })} anchorOrigin={{ vertical: 'top', horizontal: 'center' }}>
                {/* @ts-expect-error: Known type issue with MUI Alert and React 19 */}
                <Alert severity={toast.severity} sx={{ borderRadius: '12px' }}>{toast.message}</Alert>
            </Snackbar>
        </Box>
    );
}