'use client';
import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar, Link as MuiLink } from '@mui/material'; // 关键：导入 MuiLink
import Link from 'next/link';
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
	const [formData, setFormData] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({ email: '', password: '' });
	const [serverError, setServerError] = useState('');
	const [success, setSuccess] = useState(false);

    // 检查注册表单输入逻辑
	const getFieldError = (name: string, value: string) => {
		if (name === 'email') {
			if (!value) {
				return "必填";
			}
			else if (!value.includes('@')) {
				return "需要输入 @";
			}
			else if (value.startsWith('@') || value.endsWith('@') || value.split('@')[1] === '') {
				return "@前后需要输入字符";
			}
			else if (!value.includes('.')) {
				return "需要输入 .";
			} else {
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

    // 鼠标失焦后立即检查
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
            backgroundImage: 'url(/register_bg.jpg)',
            backgroundRepeat: 'no-repeat',
            backgroundSize: 'cover',
            backgroundPosition: 'center',
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            backgroundColor: 'rgba(255, 245, 230, 0.1)' 
        }}>
            <Container maxWidth="xs">
                <Paper 
                    elevation={0}
                    sx={{ 
                        p: 4, 
                        borderRadius: 5, 
                        backgroundColor: 'rgba(255, 253, 245, 0.6)', 
                        
                        backdropFilter: 'blur(15px) saturate(150%)',
                        border: '1px solid rgba(139, 115, 85, 0.2)',
                        boxShadow: '0 15px 35px rgba(100, 80, 60, 0.15)',
                    }}
                >
                    <Typography variant="h5" align="center" gutterBottom sx={{ 
                        fontWeight: 800, 
                        color: '#5d4037', 
                        letterSpacing: '2px'
                    }}>
                        注册账号
                    </Typography>

                    {serverError && <Alert severity="error" sx={{ mb: 2, borderRadius: 2 }}>{serverError}</Alert>}

                    <Box component="form" onSubmit={handleRegister} noValidate>
                        <TextField 
                            fullWidth 
                            label="邮箱" 
                            margin="normal" 
                            error={!!errors.email} 
                            helperText={errors.email} 
                            value={formData.email} 
                            onBlur={() => handleBlur('email')}
                            onChange={e => {
								setFormData({ ...formData, email: e.target.value })
								if (errors.email) setErrors({ ...errors, email: "" })
							}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    color: '#5d4037',
                                },
                                '& .MuiInputLabel-root': { color: '#8d6e63' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 110, 99, 0.3)' },
                                '&.Mui-focused .MuiOutlinedInput-notchedOutline': { borderColor: '#a1887f' },
                            }}
                        />
                        <TextField 
                            fullWidth 
                            label="密码" 
                            type="password" 
                            margin="normal" 
                            error={!!errors.password} 
                            helperText={errors.password} 
                            value={formData.password} 
                            onBlur={() => handleBlur('password')}
                            onChange={e => {
								setFormData({ ...formData, password: e.target.value })
								if (errors.email) setErrors({ ...errors, email: "" })
							}}
                            sx={{
                                '& .MuiOutlinedInput-root': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.4)',
                                    color: '#5d4037',
                                },
                                '& .MuiInputLabel-root': { color: '#8d6e63' },
                                '& .MuiOutlinedInput-notchedOutline': { borderColor: 'rgba(141, 110, 99, 0.3)' },
                            }}
                        />

                        <Button 
                            fullWidth 
                            variant="contained" 
                            size="large" 
                            type="submit" 
                            sx={{ 
                                mt: 3, 
                                mb: 2,
                                py: 1.5,
                                borderRadius: 2,
                                fontWeight: 'bold',
                                // 放弃蓝色，改用“森系灰绿”或“复古珊瑚橙”
                                // 这里推荐灰绿，它和棕色木头是绝配（大地色系）
                                background: 'linear-gradient(45deg, #6d8c7d 0%, #8da69a 100%)',
                                '&:hover': {
                                    background: 'linear-gradient(45deg, #5a7568 0%, #7a9181 100%)',
                                    boxShadow: '0 8px 20px rgba(109, 140, 125, 0.3)',
                                }
                            }}
                        >
                            立即注册
                        </Button>
                    </Box>

                    <Box sx={{ mt: 2, textAlign: 'center' }}>
                        <Typography variant="body2" sx={{ color: '#8d6e63' }}>
                            已有账号？{' '}
                            <MuiLink component={Link} href="/login" sx={{ 
                                color: '#5d4037', 
                                fontWeight: 'bold',
                                textDecoration: 'underline',
                                textDecorationColor: 'rgba(93, 64, 55, 0.3)'
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