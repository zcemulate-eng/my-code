// src/components/Topbar.tsx
'use client';

import React, { useState, useEffect } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Avatar, Typography, 
  Drawer, Stack, Button, Divider, Skeleton
} from '@mui/material';
import {
  Logout as LogoutIcon,
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { logout, getCurrentUser } from '@/app/actions/auth';
import { useRouter } from 'next/navigation';

export default function TopBar() {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const [user, setUser] = useState({
    name: '',
    email: '',
    role: '',
    phone: '',
    avatarUrl: ''
  });

  // 组件挂载时获取当前真实登录用户数据
  useEffect(() => {
    const fetchUser = async () => {
      const res = await getCurrentUser();
      if (res.success && res.data) {
        setUser({
          name: res.data.name || '未知用户',
          email: res.data.email || '',
          role: res.data.role || 'User',
          phone: res.data.phone || '未填写',
          avatarUrl: res.data.avatarUrl || ''
        });
      }
      setLoading(false);
    };
    fetchUser();
  }, []);

  // 处理注销
  const handleLogout = async () => {
    await logout();
  };

  // 提取首字母作为默认头像
  const avatarChar = user.name ? user.name.charAt(0).toUpperCase() : 'U';

  return (
    <>
      {/* --- 顶栏 (AppBar) --- */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 253, 245, 0.8)',
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139, 115, 85, 0.1)',
          color: '#5d4037'
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
          

          {/* 头像区域 (点击触发抽屉) */}
          <Box 
            onClick={() => setOpen(true)}
            sx={{ 
              display: 'flex', 
              alignItems: 'center', 
              gap: 1.5, 
              cursor: 'pointer',
              padding: '4px 12px',
              borderRadius: '50px',
              transition: '0.2s',
              '&:hover': { backgroundColor: 'rgba(109, 140, 125, 0.1)' }
            }}
          >
            {loading ? (
              <Skeleton variant="text" width={60} height={24} sx={{ display: { xs: 'none', sm: 'block' } }} />
            ) : (
              <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
                {user.name}
              </Typography>
            )}
            
            {loading ? (
              <Skeleton variant="circular" width={36} height={36} />
            ) : (
              <Avatar 
                sx={{ bgcolor: '#6d8c7d', width: 36, height: 36, fontSize: '0.9rem' }}
                src={user.avatarUrl}
              >
                {avatarChar}
              </Avatar>
            )}
          </Box>
        </Toolbar>
      </AppBar>

      {/* --- 个人信息抽屉 (Profile Drawer) --- */}
      <Drawer
        anchor="right"
        open={open}
        onClose={() => setOpen(false)}
        PaperProps={{
          sx: { width: 320, p: 3, backgroundColor: '#faf9f6' }
        }}
      >
        {/* 抽屉头部 */}
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 4 }}>
          <Typography variant="h6" sx={{ fontWeight: 800, color: '#5d4037' }}>
            个人资料
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 个人信息卡片区域 */}
        <Stack spacing={3} sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
            {loading ? (
              <Skeleton variant="circular" width={80} height={80} />
            ) : (
              <Avatar 
                sx={{ width: 80, height: 80, bgcolor: '#6d8c7d', fontSize: '2rem', boxShadow: '0 8px 24px rgba(109, 140, 125, 0.2)' }}
                src={user.avatarUrl}
              >
                {avatarChar}
              </Avatar>
            )}
            
            <Box sx={{ textAlign: 'center' }}>
              {loading ? (
                <>
                  <Skeleton variant="text" width={100} height={32} sx={{ mx: 'auto' }} />
                  <Skeleton variant="text" width={60} height={20} sx={{ mx: 'auto' }} />
                </>
              ) : (
                <>
                  <Typography variant="h6" sx={{ fontWeight: 700, color: '#5d4037' }}>
                    {user.name}
                  </Typography>
                  <Typography variant="body2" sx={{ color: '#8d6e63', fontWeight: 500 }}>
                    {user.role}
                  </Typography>
                </>
              )}
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(139, 115, 85, 0.2)' }} />

          {/* 详细信息列表 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8d6e63', mb: 0.5, display: 'block' }}>登录邮箱</Typography>
              {loading ? <Skeleton variant="text" width="80%" /> : <Typography variant="body2" sx={{ fontWeight: 500, color: '#4e342e' }}>{user.email}</Typography>}
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#8d6e63', mb: 0.5, display: 'block' }}>联系电话</Typography>
              {loading ? <Skeleton variant="text" width="50%" /> : <Typography variant="body2" sx={{ fontWeight: 500, color: '#4e342e' }}>{user.phone}</Typography>}
            </Box>
          </Box>
        </Stack>

        {/* 底部按钮区域 */}
        <Stack spacing={2} sx={{ mt: 4 }}>
          <Button 
            variant="outlined" 
            startIcon={<SettingsIcon />}
            onClick={() => {
                setOpen(false); // 关闭抽屉
                router.push('/account'); // 跳转到个人资料页
            }}
            sx={{ 
              color: '#5d4037', 
              borderColor: 'rgba(139, 115, 85, 0.3)',
              borderRadius: '12px',
              '&:hover': { borderColor: '#5d4037', backgroundColor: 'rgba(93, 64, 55, 0.04)' }
            }}
          >
            账号设置
          </Button>

          <Button 
            variant="contained" 
            color="error" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              borderRadius: '12px', 
              backgroundColor: '#ff8a65',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#ff7043', boxShadow: '0 4px 12px rgba(255, 138, 101, 0.3)' }
            }}
          >
            安全退出
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}