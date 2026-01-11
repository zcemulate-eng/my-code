'use client';
import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar, Link as MuiLink } from '@mui/material';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { loginUser } from '@/app/actions/auth';

export default function LoginPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [serverError, setServerError] = useState('');
  const [success, setSuccess] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setServerError('');
    const result = await loginUser(formData);
    if (result.success) {
      setSuccess(true);
      setTimeout(() => router.push('/dashboard'), 1500);
    } else {
      setServerError(result.message || "登录失败");
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          系统登录
        </Typography>
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
        
        <Box component="form" onSubmit={handleLogin} noValidate>
          <TextField fullWidth label="邮箱" margin="normal" onChange={e => setFormData({...formData, email: e.target.value})} />
          <TextField fullWidth label="密码" type="password" margin="normal" onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <Button fullWidth variant="contained" size="large" type="submit" sx={{ mt: 3, mb: 2 }}>
            立即登录
          </Button>

          {/* 新增跳转注册链接 */}
          <Box sx={{ textAlign: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              还没账户？{' '}
              <MuiLink component={Link} href="/register" fontWeight="bold">
                立即去注册
              </MuiLink>
            </Typography>
          </Box>
        </Box>
      </Paper>
      <Snackbar open={success} autoHideDuration={2000} message="登录成功，正在跳转..." />
    </Container>
  );
}