// src/app/login/page.tsx
'use client';
import React, { useState } from 'react'; // 修复 1：引入 React
import {
	TextField, Button, Typography, Box, Alert, Snackbar,
	Link as MuiLink, InputAdornment, Paper, Stack
} from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import EmailIcon from '@mui/icons-material/Email';
import LockIcon from '@mui/icons-material/Lock';
import { loginUser } from '@/app/actions/auth'; // 引入真实的登录 Server Action

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
		
        // 调用真实的后端验证
		const result = await loginUser(formData); 
        
        if (result.success) {
            setSuccess(true);
            setTimeout(() => router.push('/dashboard'), 1500);
        } else {
            setServerError(result.message || "登录失败，请检查账号密码");
        }
	};

	return (
		<Box sx={{
			minHeight: '100vh', display: 'flex', justifyContent: 'center', alignItems: 'center',
			background: 'linear-gradient(135deg, #fdfbf7 0%, #e8e6e1 100%)', p: 2
		}}>
			<Paper elevation={0} sx={{
				width: '100%', maxWidth: '450px', p: { xs: 4, md: 5 }, borderRadius: '32px',
				backgroundColor: 'rgba(255, 255, 255, 0.65)', backdropFilter: 'blur(20px) saturate(150%)',
				border: '1px solid rgba(255, 255, 255, 0.5)', boxShadow: '0 20px 40px rgba(93, 64, 55, 0.08)',
			}}>
				<Box sx={{ textAlign: 'center', mb: 4 }}>
					<Typography variant="h4" gutterBottom sx={{ fontWeight: 900, color: '#5d4037', letterSpacing: '-0.5px' }}>
						Welcome Back
					</Typography>
					<Typography variant="body2" sx={{ color: '#8d6e63' }}>请输入您的账号信息以继续</Typography>
				</Box>

				{serverError && (
                    /* 修复 2：使用 @ts-expect-error 绕过 MUI Alert 在 React 19 中的子组件类型报错 */
                    // @ts-expect-error: Known type issue with MUI Alert and React 19
                    <Alert severity="error" variant="filled" sx={{ mb: 3, borderRadius: '12px' }}>
                        {serverError}
                    </Alert>
                )}

				<Box component="form" onSubmit={handleLogin} noValidate>
					<Stack spacing={3}>
						<TextField
							fullWidth placeholder="邮箱" error={!!errors.email} helperText={errors.email}
							value={formData.email} onBlur={() => handleBlur('email')}
                            /* 修复 3：明确 e 的类型 */
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, email: e.target.value })}
							slotProps={{ input: { startAdornment: <InputAdornment position="start"><EmailIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
							sx={{
								'& .MuiOutlinedInput-root': { borderRadius: '50px', backgroundColor: 'rgba(255, 255, 255, 0.5)', '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' }, '&:hover fieldset': { borderColor: '#6d8c7d' }, '&.Mui-focused fieldset': { borderColor: '#6d8c7d', borderWidth: '2px' } },
								'& .MuiInputBase-input': { color: '#5d4037', fontWeight: 500 }
							}}
						/>

						<TextField
							fullWidth placeholder="密码" type="password" error={!!errors.password} helperText={errors.password}
							value={formData.password} onBlur={() => handleBlur('password')}
                            /* 修复 3：明确 e 的类型 */
							onChange={(e: React.ChangeEvent<HTMLInputElement>) => setFormData({ ...formData, password: e.target.value })}
							slotProps={{ input: { startAdornment: <InputAdornment position="start"><LockIcon sx={{ color: '#8d6e63' }} /></InputAdornment> } }}
							sx={{
								'& .MuiOutlinedInput-root': { borderRadius: '50px', backgroundColor: 'rgba(255, 255, 255, 0.5)', '& fieldset': { borderColor: 'rgba(141, 110, 99, 0.15)' }, '&:hover fieldset': { borderColor: '#6d8c7d' }, '&.Mui-focused fieldset': { borderColor: '#6d8c7d', borderWidth: '2px' } },
								'& .MuiInputBase-input': { color: '#5d4037', fontWeight: 500 }
							}}
						/>
					</Stack>

					<Button
						fullWidth variant="contained" size="large" type="submit"
						sx={{ mt: 5, py: 1.8, borderRadius: '50px', fontWeight: 'bold', fontSize: '1rem', letterSpacing: '1px', background: 'linear-gradient(135deg, #6d8c7d 0%, #5a7568 100%)', boxShadow: '0 8px 20px rgba(90, 117, 104, 0.25)', '&:hover': { background: 'linear-gradient(135deg, #5a7568 0%, #4b6358 100%)', boxShadow: '0 10px 25px rgba(90, 117, 104, 0.35)' } }}
					>
						立即登录
					</Button>

					<Box sx={{ mt: 4, textAlign: 'center' }}>
						<Typography variant="body2" sx={{ color: '#8d6e63' }}>
							还没有账户？{' '}
							<MuiLink component={Link} href="/register" sx={{ color: '#5d4037', fontWeight: '800', textDecoration: 'none', position: 'relative', '&::after': { content: '""', position: 'absolute', width: '100%', height: '2px', bottom: '-2px', left: 0, backgroundColor: '#6d8c7d', transform: 'scaleX(0)', transition: 'transform 0.3s ease-in-out', transformOrigin: 'right' }, '&:hover::after': { transform: 'scaleX(1)', transformOrigin: 'left' } }}>
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