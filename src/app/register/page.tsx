// src/app/register/page.tsx
'use client';
import React, { useState } from 'react';
import { 
    Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar, 
    Link as MuiLink, Stack, InputAdornment, Grid 
} from '@mui/material';
import Link from 'next/link';

// 图标导入
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import PhoneIcon from '@mui/icons-material/Phone';
import LockIcon from '@mui/icons-material/Lock';
import HomeIcon from '@mui/icons-material/Home';

import { registerUser } from '@/app/actions/auth';

// 统一的输入框样式
const sharedInputSx = {
    '& .MuiOutlinedInput-root': {
        borderRadius: '50px',
        backgroundColor: 'rgba(255, 255, 255, 0.5)',
        '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' },
        '&:hover fieldset': { borderColor: '#8d6e63' },
        '&.Mui-focused fieldset': { borderColor: '#8d6e63', borderWidth: '2px' },
    },
    '& .MuiInputBase-input': { color: '#4e342e', fontWeight: 500 }
};

export default function RegisterPage() {
    const [formData, setFormData] = useState({ 
        username: '', email: '', phone: '', dob: '', password: '', confirmPassword: '', address: '' 
    });
    
    const [errors, setErrors] = useState({ 
        username: '', email: '', phone: '', password: '', confirmPassword: '' 
    });
    
    const [serverError, setServerError] = useState('');
    const [success, setSuccess] = useState(false);

    const getFieldError = (name: string, value: string) => {
        if (name === 'username' && !value) return "必填";
        if (name === 'email') {
            if (!value) return "必填";
            if (!value.includes('@')) return "需要输入 @";
            if (value.startsWith('@') || value.endsWith('@') || value.split('@')[1] === '') return "@前后需要输入字符";
            if (!value.includes('.')) return "需要输入 .";
            const suffix = value.split('@')[1].split('.').pop() || '';
            if (suffix.length < 2) return "域名后缀至少2位";
            if (!/^[a-zA-Z]+$/.test(suffix)) return "域名后缀只能是字母";
        }
        if (name === 'phone') {
            if (!value) return "必填";
            // 👉 优先拦截：如果首位不是 1
            if (value.charAt(0) !== '1') {
                return "首位数字要求为 1";
            }
            // 👉 其次拦截：如果包含非数字或者长度不是 11 位
            if (!/^\d{11}$/.test(value)) {
                return "电话号码要求 11 位数字";
            }
        }
        if (name === 'password') {
            if (!value) return "必填";
            if (value.length < 6) return "至少6位";
        }
        if (name === 'confirmPassword') {
            if (!value) return "必填";
            if (value !== formData.password) return "两次输入的密码不一致";
        }
        return "";
    };

    const handleBlur = (field: keyof typeof errors) => {
        const error = getFieldError(field, formData[field]);
        setErrors(prev => ({ ...prev, [field]: error }));
    };

    const validate = () => {
        const newErrors = {
            username: getFieldError('username', formData.username),
            email: getFieldError('email', formData.email),
            phone: getFieldError('phone', formData.phone),
            password: getFieldError('password', formData.password),
            confirmPassword: getFieldError('confirmPassword', formData.confirmPassword),
        };
        setErrors(newErrors);
        return Object.values(newErrors).every(x => x === "");
    };

    const handleRegister = async (e: React.FormEvent) => {
        e.preventDefault();
        setServerError('');

        if (validate()) {
            const result = await registerUser(formData);
            if (result.success) {
                setSuccess(true);
                setFormData({ username: '', email: '', phone: '', dob: '', password: '', confirmPassword: '', address: '' });
            } else {
                // 👉 新增：如果是昵称被占用，直接挂载到输入框下方红字提示
                if (result.message === "该昵称已被人使用") {
                    setErrors(prev => ({ ...prev, username: result.message }));
                } else {
                    setServerError(result.message || '注册失败');
                }
            }
        }
    };

    return (
        <Box sx={{
            minHeight: '100vh', width: '100%', display: 'flex', justifyContent: 'center', alignItems: 'center',
            background: 'linear-gradient(135deg, #f1f8f5 0%, #dde4e0 100%)', p: 2
        }}>
            <Container maxWidth="sm">
                <Paper elevation={0} sx={{ 
                    p: { xs: 4, sm: 5 }, borderRadius: '32px', backgroundColor: 'rgba(255, 255, 255, 0.65)', 
                    backdropFilter: 'blur(20px) saturate(150%)', border: '1px solid rgba(255, 255, 255, 0.5)',
                    boxShadow: '0 20px 40px rgba(85, 107, 95, 0.08)'
                }}>
                    <Box sx={{ textAlign: 'center', mb: 3 }}>
                        <Box sx={{ display: 'inline-flex', p: 1.5, borderRadius: '50%', bgcolor: 'rgba(141, 110, 99, 0.1)', mb: 2 }}>
                            <PersonAddIcon sx={{ color: '#6d4c41', fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ fontWeight: 800, color: '#4e342e', letterSpacing: '1px' }}>
                            创建新账号
                        </Typography>
                    </Box>

                    {serverError && (
                        // @ts-expect-error: Known type issue with MUI Alert and React 19
                        <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>
                            {serverError}
                        </Alert>
                    )}

                    <Box component="form" onSubmit={handleRegister} noValidate>
                        <Stack spacing={2}>
                            
                            <TextField 
                                fullWidth size="small" placeholder="用户名/昵称 *" 
                                error={!!errors.username} helperText={errors.username}
                                value={formData.username} onBlur={() => handleBlur('username')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFormData({ ...formData, username: e.target.value });
                                    if (errors.username) setErrors({ ...errors, username: "" });
                                }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><PersonIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                sx={sharedInputSx}
                            />

                            <TextField 
                                fullWidth size="small" placeholder="邮箱 *" 
                                error={!!errors.email} helperText={errors.email} 
                                value={formData.email} onBlur={() => handleBlur('email')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFormData({ ...formData, email: e.target.value });
                                    if (errors.email) setErrors({ ...errors, email: "" });
                                }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                sx={sharedInputSx}
                            />

                            <Grid container spacing={2}>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 0.5, ml: 1, fontWeight: 'bold' }}>电话号码 *</Typography>
                                    <TextField 
                                        fullWidth size="small" placeholder="输入电话号码" 
                                        error={!!errors.phone} helperText={errors.phone}
                                        value={formData.phone} onBlur={() => handleBlur('phone')}
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                            setFormData({ ...formData, phone: e.target.value });
                                            if (errors.phone) setErrors({ ...errors, phone: "" });
                                        }}
                                        slotProps={{ input: { startAdornment: <InputAdornment position="start"><PhoneIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                        sx={sharedInputSx}
                                    />
                                </Grid>
                                <Grid size={{ xs: 12, sm: 6 }}>
                                    <Typography variant="caption" sx={{ color: '#795548', display: 'block', mb: 0.5, ml: 1, fontWeight: 'bold' }}>年/月/日 (选填)</Typography>
                                    <TextField 
                                        fullWidth size="small" 
                                        type="date" // 👉 新增：唤起浏览器原生日历
                                        InputLabelProps={{ shrink: true }} // 防止文字重叠
                                        value={formData.dob} 
                                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, dob: e.target.value })}
                                        // 注：使用原生日历时，移除了图标，保持样式清爽
                                        sx={sharedInputSx}
                                    />
                                </Grid>
                            </Grid>

                            <TextField 
                                fullWidth size="small" placeholder="填写密码 *" type="password" 
                                error={!!errors.password} helperText={errors.password} 
                                value={formData.password} onBlur={() => handleBlur('password')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFormData({ ...formData, password: e.target.value });
                                    if (errors.password) setErrors({ ...errors, password: "" });
                                }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                sx={sharedInputSx}
                            />

                            <TextField 
                                fullWidth size="small" placeholder="确定密码 *" type="password" 
                                error={!!errors.confirmPassword} helperText={errors.confirmPassword} 
                                value={formData.confirmPassword} onBlur={() => handleBlur('confirmPassword')}
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                                    setFormData({ ...formData, confirmPassword: e.target.value });
                                    if (errors.confirmPassword) setErrors({ ...errors, confirmPassword: "" });
                                }}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                sx={sharedInputSx}
                            />

                            <TextField 
                                fullWidth size="small" placeholder="地址 (选填)" 
                                value={formData.address} 
                                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, address: e.target.value })}
                                slotProps={{ input: { startAdornment: <InputAdornment position="start"><HomeIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
                                sx={sharedInputSx}
                            />
                        </Stack>

                        <Button 
                            fullWidth variant="contained" type="submit" 
                            sx={{ 
                                mt: 3, mb: 2, py: 1.5, borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem',
                                background: 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)',
                                boxShadow: '0 8px 20px rgba(109, 76, 65, 0.25)',
                                '&:hover': { background: 'linear-gradient(135deg, #795548 0%, #5d4037 100%)', boxShadow: '0 10px 25px rgba(109, 76, 65, 0.35)' }
                            }}
                        >
                            立即注册
                        </Button>
                    </Box>

                    <Box sx={{ mt: 1, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#795548' }}>
                            已有账号？{' '}
                            <MuiLink component={Link} href="/login" sx={{ 
                                color: '#4e342e', fontWeight: '800', textDecoration: 'none', position: 'relative',
                                '&::after': {
                                    content: '""', position: 'absolute', width: '100%', height: '2px',
                                    bottom: '-2px', left: 0, backgroundColor: '#8d6e63',
                                    transform: 'scaleX(0)', transition: 'transform 0.3s ease-in-out', transformOrigin: 'right',
                                },
                                '&:hover::after': { transform: 'scaleX(1)', transformOrigin: 'left' }
                            }}>
                                直接去登录
                            </MuiLink>
                        </Typography>
                    </Box>
                </Paper>

                <Snackbar open={success} autoHideDuration={3000} onClose={() => setSuccess(false)} message="注册成功！" />
            </Container>
        </Box>
    );
}