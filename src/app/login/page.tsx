'use client';
import { useState } from 'react';
import {
	TextField, Button, Typography, Box, Alert, Snackbar,
	Link as MuiLink, InputAdornment, Paper
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
		// 执行登录逻辑...
		setSuccess(true);
		setTimeout(() => router.push('/dashboard'), 1500);
	};

	return (
		<Box sx={{
			minHeight: '100vh',
			display: 'flex',
			justifyContent: 'center',
			alignItems: 'center',
			backgroundColor: 'rgba(255, 245, 230, 0.2)',
			backgroundSize: 'cover',
			p: 2
		}}>
			<Paper elevation={0} sx={{
				display: 'flex',
				width: '100%',
				maxWidth: '950px',
				minHeight: '580px',
				borderRadius: '32px', 
				overflow: 'hidden',
				flexDirection: { xs: 'column', md: 'row' },
				backgroundColor: 'rgba(255, 253, 245, 0.7)',
				backdropFilter: 'blur(15px) saturate(150%)',
				border: '1px solid rgba(139, 115, 85, 0.2)',
				boxShadow: '0 20px 50px rgba(100, 80, 60, 0.15)',
			}}>

				<Box sx={{
					flex: 1.2,
					backgroundImage: 'url(/login_bg.jpg)', 
					backgroundRepeat: 'no-repeat',
					backgroundSize: 'cover',
					backgroundPosition: 'center',
					display: { xs: 'none', md: 'block' }
				}} />

				<Box sx={{
					flex: 1,
					display: 'flex',
					flexDirection: 'column',
					justifyContent: 'center',
					px: { xs: 4, md: 6 },
					py: 5
				}}>
					<Typography variant="h4" align="center" gutterBottom sx={{
						fontWeight: 900,
						color: '#5d4037',
						letterSpacing: '1px'
					}}>
						欢迎回来
					</Typography>


					{serverError && <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: '12px' }}>{serverError}</Alert>}

					<Box component="form" onSubmit={handleLogin} noValidate>
						<TextField
							fullWidth
							placeholder="邮箱"
							margin="normal"
							error={!!errors.email}
							helperText={errors.email}
							value={formData.email}
							onBlur={() => handleBlur('email')}
							onChange={e => setFormData({ ...formData, email: e.target.value })}
							slotProps={{
								input: {
									startAdornment: (
										<InputAdornment position="start">
											<EmailIcon sx={{ color: '#8d6e63', ml: 1 }} />
										</InputAdornment>
									),
								},
							}}
							sx={{
								'& .MuiOutlinedInput-root': {
									borderRadius: '50px',
									backgroundColor: 'rgba(255, 255, 255, 0.5)',
									'& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' }
								},
								'& .MuiInputBase-input': { color: '#5d4037' }
							}}
						/>

						<TextField
							fullWidth
							placeholder="密码"
							type="password"
							margin="normal"
							error={!!errors.password}
							helperText={errors.password}
							value={formData.password}
							onBlur={() => handleBlur('password')}
							onChange={e => setFormData({ ...formData, password: e.target.value })}
							InputProps={{
								startAdornment: (
									<InputAdornment position="start">
										<LockIcon sx={{ color: '#8d6e63' }} />
									</InputAdornment>
								),
							}}
							sx={{
								mt: 2,
								'& .MuiOutlinedInput-root': {
									borderRadius: '50px',
									backgroundColor: 'rgba(255, 255, 255, 0.5)',
									'& fieldset': { borderColor: 'rgba(141, 110, 99, 0.2)' }
								}
							}}
						/>


						<Button
							fullWidth
							variant="contained"
							size="large"
							type="submit"
							sx={{
								mt: 4,
								py: 1.5,
								borderRadius: '50px',
								fontWeight: 'bold',
								background: 'linear-gradient(45deg, #6d8c7d 0%, #8da69a 100%)',
								boxShadow: '0 8px 20px rgba(109, 140, 125, 0.2)',
								'&:hover': {
									background: 'linear-gradient(45deg, #5a7568 0%, #7a9181 100%)',
								}
							}}
						>
							立即登录
						</Button>

						<Box sx={{ mt: 4, textAlign: 'center' }}>
							<Typography variant="body2" sx={{ color: '#8d6e63' }}>
								还没有账户？{' '}
								<MuiLink component={Link} href="/register" sx={{ color: '#5d4037', fontWeight: 'bold' }}>
									立即注册
								</MuiLink>
							</Typography>
						</Box>
					</Box>
				</Box>
			</Paper>

			<Snackbar open={success} autoHideDuration={2000} message="登录成功，正在跳转..." />
		</Box>
	);
}