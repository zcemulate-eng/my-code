// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import {
	TextField, Button, Typography, Box, Alert, Snackbar,
	Link as MuiLink, InputAdornment, Paper, Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';

export default function LoginPage() {
	const router = useRouter();
	const [formData, setFormData] = useState({ email: '', password: '' });
	const [errors, setErrors] = useState({ email: '', password: '' });
	const [serverError, setServerError] = useState('');
	const [success, setSuccess] = useState(false);

	const getFieldError = (name: string, value: string) => {
		if (name === 'email') {
			if (!value) return "必填";
			if (!value.includes('@')) return "缺少 @ 符号";
			return "";
		}
		if (name === 'password') {
			if (value.length < 6) return "至少 6 位密码";
			return "";
		}
		return "";
	};

	const handleBlur = (field: 'email' | 'password') => {
		const error = getFieldError(field, formData[field]);
		setErrors(prev => ({ ...prev, [field]: error }));
	};

	const handleLogin = async (e: React.FormEvent) => {
		e.preventDefault();
		setServerError('');
		// 这里保留你的登录逻辑...
		// const result = await loginUser(formData); ...
		
		// 模拟成功
		setSuccess(true);
		setTimeout(() => router.push('/dashboard'), 1500);
	};

	return (
		<Box sx={{
			minHeight: '100vh',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			// 改动：大地森林暖色调背景 (浅卡其 -> 暖米灰)
			background: 'linear-gradient(135deg, #fdfbf7 0%, #e8e6e1 100%)',
			p: 2
		}}>
			<Paper elevation={0} sx={{
				width: '100%',
				maxWidth: '450px', // 改动：限制宽度，使其居中显示
				p: { xs: 4, md: 5 },
				borderRadius: '32px',
				// 改动：背景色改为与页面融合的半透明暖白
				backgroundColor: 'rgba(255, 255, 255, 0.65)',
				backdropFilter: 'blur(20px) saturate(150%)',
				border: '1px solid rgba(255, 255, 255, 0.5)',
				boxShadow: '0 20px 40px rgba(93, 64, 55, 0.08)', // 阴影颜色调暖
			}}>
				
				<Box sx={{ textAlign: 'center', mb: 4 }}>
					<Typography variant="h4" gutterBottom sx={{
						fontWeight: 900,
						color: '#5d4037', // 深棕色字体
						letterSpacing: '-0.5px'
					}}>
						Welcome Back
					</Typography>
					<Typography variant="body2" sx={{ color: '#8d6e63' }}>
						请输入您的账号信息以继续
					</Typography>
				</Box>

				{serverError && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: '12px' }}>{serverError}</Alert>}

				<Box component="form" onSubmit={handleLogin} noValidate>
					<Stack spacing={3}>
						<TextField
							fullWidth
							placeholder="邮箱"
							error={!!errors.email}
							helperText={errors.email}
							value={formData.email}
							onBlur={() => handleBlur('email')}
							onChange={e => setFormData({ ...formData, email: e.target.value })}
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
									'& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' }, // 边框淡化
									'&:hover fieldset': { borderColor: '#6d8c7d' }, // 悬停绿色
									'&.Mui-focused fieldset': { borderColor: '#6d8c7d', borderWidth: '2px' },
								},
								'& .MuiInputBase-input': { color: '#5d4037', fontWeight: 500 }
							}}
						/>

						<TextField
							fullWidth
							placeholder="密码"
							type="password"
							error={!!errors.password}
							helperText={errors.password}
							value={formData.password}
							onBlur={() => handleBlur('password')}
							onChange={e => setFormData({ ...formData, password: e.target.value })}
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
									'&:hover fieldset': { borderColor: '#6d8c7d' },
									'&.Mui-focused fieldset': { borderColor: '#6d8c7d', borderWidth: '2px' },
								},
								'& .MuiInputBase-input': { color: '#5d4037', fontWeight: 500 }
							}}
						/>
					</Stack>

					<Button
						fullWidth
						variant="contained"
						size="large"
						type="submit"
						sx={{
							mt: 5,
							py: 1.8,
							borderRadius: '50px',
							fontWeight: 'bold',
							fontSize: '1rem',
							letterSpacing: '1px',
							// 改动：森系渐变绿
							background: 'linear-gradient(135deg, #6d8c7d 0%, #5a7568 100%)',
							boxShadow: '0 8px 20px rgba(90, 117, 104, 0.25)',
							'&:hover': {
								background: 'linear-gradient(135deg, #5a7568 0%, #4b6358 100%)',
								boxShadow: '0 10px 25px rgba(90, 117, 104, 0.35)',
							}
						}}
					>
						立即登录
					</Button>

					<Box sx={{ mt: 4, textAlign: 'center' }}>
						<Typography variant="body2" sx={{ color: '#8d6e63' }}>
							还没有账户？{' '}
							<MuiLink component={Link} href="/register" sx={{ 
								color: '#5d4037', 
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
									backgroundColor: '#6d8c7d',
									transform: 'scaleX(0)',
									transition: 'transform 0.3s ease-in-out',
									transformOrigin: 'right',
								},
								'&:hover::after': {
									transform: 'scaleX(1)',
									transformOrigin: 'left',
								}
							}}>
								注册账号
							</MuiLink>
						</Typography>
					</Box>
				</Box>
			</Paper>

			<Snackbar open={success} autoHideDuration={2000} message="登录成功，正在跳转..." />
		</Box>
	);
}