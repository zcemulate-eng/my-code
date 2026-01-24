// src/app/register/page.tsx
'use client';
import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar, Link as MuiLink, Stack, InputAdornment } from '@mui/material';
import Link from 'next/link';
import PersonAddIcon from '@mui/icons-material/PersonAdd'; // 增加图标，提升精致感
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
	const [formData, setFormData] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({ email: '', password: '' });
	const [serverError, setServerError] = useState('');
	const [success, setSuccess] = useState(false);

	const getFieldError = (name: string, value: string) => {
		if (name === 'email') {
			if (!value) return "必填";
			else if (!value.includes('@')) return "需要输入 @";
			else if (value.startsWith('@') || value.endsWith('@') || value.split('@')[1] === '') return "@前后需要输入字符";
			else if (!value.includes('.')) return "需要输入 .";
			else {
				const domainPart = value.split('@')[1];
				const suffix = domainPart.split('.').pop() || '';
				if (suffix.length < 2) return "域名后缀至少2位";
				if (!/^[a-zA-Z]+$/.test(suffix)) return "域名后缀只能是字母";
			}
		}
		if (name === 'password') {
			if (value.length < 6) return "至少6位";
		}
		return "";
	};

	const handleBlur = (field: 'email' | 'password') => {
		const error = getFieldError(field, formData[field]);
		setErrors(prev => ({ ...prev, [field]: error }));
	};

	const validate = () => {
		const newErrors = {
			email: getFieldError('email', formData.email),
			password: getFieldError('password', formData.password),
		};
		setErrors(newErrors);
		return Object.values(newErrors).every(x => x === "");
	};

	const handleRegister = async (e: React.FormEvent) => {
		e.preventDefault();
		if (validate()) {
			const result = await registerUser(formData);
			if (result.success) {
				setSuccess(true);
				setFormData({ email: '', password: '' });
			} else {
				setServerError(result.message || '注册失败');
			}
		}
	};

	return (
        <Box sx={{
            minHeight: '100vh',
            width: '100%',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            // 改动 1: 背景色调整为“清晨迷雾绿”，比登录页更清新，但同属自然色系
            background: 'linear-gradient(135deg, #f1f8f5 0%, #dde4e0 100%)',
            p: 2
        }}>
            <Container maxWidth="xs">
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: { xs: 4, sm: 5 }, 
                        borderRadius: '32px', 
                        // 卡片保持一致的磨砂质感
                        backgroundColor: 'rgba(255, 255, 255, 0.65)', 
                        backdropFilter: 'blur(20px) saturate(150%)',
                        border: '1px solid rgba(255, 255, 255, 0.5)',
                        // 阴影稍微带一点点绿色调，与背景呼应
                        boxShadow: '0 20px 40px rgba(85, 107, 95, 0.08)',
                    }}
                >
                    <Box sx={{ textAlign: 'center', mb: 4 }}>
                        <Box sx={{ 
                            display: 'inline-flex', 
                            p: 1.5, 
                            borderRadius: '50%', 
                            bgcolor: 'rgba(141, 110, 99, 0.1)', 
                            mb: 2 
                        }}>
                            <PersonAddIcon sx={{ color: '#6d4c41', fontSize: 32 }} />
                        </Box>
                        <Typography variant="h5" gutterBottom sx={{ 
                            fontWeight: 800, 
                            color: '#4e342e', // 深棕色，比登录页略深一点点
                            letterSpacing: '1px'
                        }}>
                            创建新账号
                        </Typography>
                        <Typography variant="body2" sx={{ color: '#795548' }}>
                            Join the community
                        </Typography>
                    </Box>

                    {serverError && <Alert severity="error" sx={{ mb: 3, borderRadius: '12px' }}>{serverError}</Alert>}

                    <Box component="form" onSubmit={handleRegister} noValidate>
                        <Stack spacing={2.5}>
                            <TextField 
                                fullWidth 
                                placeholder="请输入邮箱" 
                                variant="outlined"
                                error={!!errors.email} 
                                helperText={errors.email} 
                                value={formData.email} 
                                onBlur={() => handleBlur('email')}
                                onChange={e => {
                                    setFormData({ ...formData, email: e.target.value })
                                    if (errors.email) setErrors({ ...errors, email: "" })
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <EmailIcon sx={{ color: '#8d6e63' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '50px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                        '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' },
                                        // 改动 2: 悬停和焦点状态使用“大地暖棕色”，与登录页的绿色区分
                                        '&:hover fieldset': { borderColor: '#8d6e63' },
                                        '&.Mui-focused fieldset': { borderColor: '#8d6e63', borderWidth: '2px' },
                                    },
                                    '& .MuiInputBase-input': { color: '#4e342e', fontWeight: 500 }
                                }}
                            />
                            <TextField 
                                fullWidth 
                                placeholder="设置密码" 
                                type="password" 
                                variant="outlined"
                                error={!!errors.password} 
                                helperText={errors.password} 
                                value={formData.password} 
                                onBlur={() => handleBlur('password')}
                                onChange={e => {
                                    setFormData({ ...formData, password: e.target.value })
                                    if (errors.email) setErrors({ ...errors, email: "" })
                                }}
                                slotProps={{
                                    input: {
                                        startAdornment: (
                                            <InputAdornment position="start">
                                                <LockIcon sx={{ color: '#8d6e63' }} />
                                            </InputAdornment>
                                        ),
                                    },
                                }}
                                sx={{
                                    '& .MuiOutlinedInput-root': {
                                        borderRadius: '50px',
                                        backgroundColor: 'rgba(255, 255, 255, 0.5)',
                                        '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' },
                                        '&:hover fieldset': { borderColor: '#8d6e63' },
                                        '&.Mui-focused fieldset': { borderColor: '#8d6e63', borderWidth: '2px' },
                                    },
                                    '& .MuiInputBase-input': { color: '#4e342e', fontWeight: 500 }
                                }}
                            />
                        </Stack>

                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="large" 
                            type="submit" 
                            sx={{ 
                                mt: 4, 
                                mb: 2,
                                py: 1.5,
                                borderRadius: '50px',
                                fontWeight: 'bold',
                                fontSize: '1rem',
                                // 改动 3: 按钮使用“大地暖棕色渐变”，与背景的绿色形成互补
                                background: 'linear-gradient(135deg, #8d6e63 0%, #6d4c41 100%)',
                                boxShadow: '0 8px 20px rgba(109, 76, 65, 0.25)',
                                '&:hover': {
                                    background: 'linear-gradient(135deg, #795548 0%, #5d4037 100%)',
                                    boxShadow: '0 10px 25px rgba(109, 76, 65, 0.35)',
                                }
                            }}
                        >
                            立即注册
                        </Button>
                    </Box>

                    <Box sx={{ mt: 3, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#795548' }}>
                            已有账号？{' '}
                            <MuiLink component={Link} href="/login" sx={{ 
                                color: '#4e342e', 
                                fontWeight: '800',
                                textDecoration: 'none',
                                position: 'relative',
                                '&::after': {
                                    content: '""',
                                    position: 'absolute',
                                    width: '100%',
                                    height: '2px',
                                    bottom: '-2px',
                                    left: 0,
                                    backgroundColor: '#8d6e63', // 棕色下划线
                                    transform: 'scaleX(0)',
                                    transition: 'transform 0.3s ease-in-out',
                                    transformOrigin: 'right',
                                },
                                '&:hover::after': {
                                    transform: 'scaleX(1)',
                                    transformOrigin: 'left',
                                }
                            }}>
                                直接去登录
                            </MuiLink>
                        </Typography>
                    </Box>
                </Paper>

                <Snackbar 
                    open={success} 
                    autoHideDuration={3000} 
                    onClose={() => setSuccess(false)}
                    message="注册成功！" 
                />
            </Container>
        </Box>
    );
}