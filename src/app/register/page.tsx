'use client';
import { useState } from 'react';
import { Container, Paper, TextField, Button, Typography, Box, Alert, Snackbar, Link as MuiLink } from '@mui/material'; // 关键：导入 MuiLink
import Link from 'next/link'; // 关键：导入 Next.js 的 Link
import { registerUser } from '@/app/actions/auth';

export default function RegisterPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [errors, setErrors] = useState({ email: '', password: '' });
  const [serverError, setServerError] = useState(''); 
  const [success, setSuccess] = useState(false);

  const validate = () => {
    let temp = { email: '', password: '' };
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!formData.email) temp.email = "必填";
    else if (!emailRegex.test(formData.email)) temp.email = "格式错误";
    if (formData.password.length < 6) temp.password = "至少6位";
    setErrors(temp);
    return Object.values(temp).every(x => x === "");
  };

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (validate()) {
      const result = await registerUser(formData);
      if (result.success) { 
        setSuccess(true); 
        setFormData({email:'', password:''}); 
      } else {
        setServerError(result.message || '注册失败');
      }
    }
  };

  return (
    <Container maxWidth="xs" sx={{ mt: 10 }}>
      <Paper elevation={3} sx={{ p: 4, borderRadius: 2 }}>
        <Typography variant="h5" align="center" gutterBottom sx={{ fontWeight: 'bold' }}>
          注册账号
        </Typography>
        
        {serverError && <Alert severity="error" sx={{ mb: 2 }}>{serverError}</Alert>}
        
        <Box component="form" onSubmit={handleRegister} noValidate>
          <TextField fullWidth label="邮箱" margin="normal" error={!!errors.email} helperText={errors.email} value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} />
          <TextField fullWidth label="密码" type="password" margin="normal" error={!!errors.password} helperText={errors.password} value={formData.password} onChange={e => setFormData({...formData, password: e.target.value})} />
          
          <Button fullWidth variant="contained" size="large" type="submit" sx={{ mt: 3, mb: 2 }}>
            立即注册
          </Button>
        </Box>

        {/* 跳转登录链接 */}
        <Box sx={{ mt: 2, textAlign: 'center' }}>
          <Typography variant="body2" color="text.secondary">
            已有账号？{' '}
            <MuiLink component={Link} href="/login" fontWeight="bold">
              直接去登录
            </MuiLink>
          </Typography>
        </Box>
      </Paper>
      
      <Snackbar open={success} autoHideDuration={3000} message="注册成功！" />
    </Container>
  );
}