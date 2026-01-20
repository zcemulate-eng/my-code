'use client';

import React, { useState } from 'react';
import {
  AppBar, Toolbar, Box, IconButton, Avatar, Typography, 
  Drawer, Stack, Button, Divider, Badge
} from '@mui/material';
import {
  Notifications as NotificationsIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Settings as SettingsIcon,
  Close as CloseIcon
} from '@mui/icons-material';
import { logout } from '@/app/actions/auth';

// 模拟当前登录用户数据 (后续可替换为从 Context 或 API 获取)
const currentUser = {
  name: 'Admin User',
  email: 'admin@company.com',
  role: 'Administrator',
  department: 'HQ / IT Dept',
  avatarUrl: '' // 如果有图片链接填这里，没有则显示首字母
};

export default function TopBar() {
  const [open, setOpen] = useState(false);

  // 处理注销
  const handleLogout = async () => {
    await logout();
  };

  return (
    <>
      {/* --- 顶栏 (AppBar) --- */}
      <AppBar 
        position="sticky" 
        elevation={0}
        sx={{
          backgroundColor: 'rgba(255, 253, 245, 0.8)', // 玻璃拟态背景
          backdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(139, 115, 85, 0.1)',
          color: '#5d4037',
          zIndex: (theme) => theme.zIndex.drawer + 1 // 确保在侧边栏之上(可选)
        }}
      >
        <Toolbar sx={{ justifyContent: 'flex-end', gap: 2 }}>
          
          {/* 这里预留空间给未来的扩展功能，比如通知铃铛 */}
          <IconButton size="small">
            <Badge variant="dot" color="error">
              <NotificationsIcon sx={{ color: '#8d6e63' }} />
            </Badge>
          </IconButton>

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
            <Typography variant="body2" sx={{ fontWeight: 600, display: { xs: 'none', sm: 'block' } }}>
              {currentUser.name}
            </Typography>
            <Avatar 
              sx={{ 
                bgcolor: '#6d8c7d', 
                width: 36, 
                height: 36,
                fontSize: '0.9rem'
              }}
              src={currentUser.avatarUrl}
            >
              {currentUser.name.charAt(0)}
            </Avatar>
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
            My Profile
          </Typography>
          <IconButton onClick={() => setOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        {/* 个人信息卡片区域 */}
        <Stack spacing={3} sx={{ flexGrow: 1 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 2, mb: 2 }}>
            <Avatar 
              sx={{ width: 80, height: 80, bgcolor: '#6d8c7d', fontSize: '2rem' }}
              src={currentUser.avatarUrl}
            >
              {currentUser.name.charAt(0)}
            </Avatar>
            <Box sx={{ textAlign: 'center' }}>
              <Typography variant="h6" sx={{ fontWeight: 700, color: '#5d4037' }}>
                {currentUser.name}
              </Typography>
              <Typography variant="body2" sx={{ color: '#8d6e63' }}>
                {currentUser.role}
              </Typography>
            </Box>
          </Box>

          <Divider sx={{ borderColor: 'rgba(139, 115, 85, 0.2)' }} />

          {/* 详细信息列表 */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <Box>
              <Typography variant="caption" sx={{ color: '#8d6e63', mb: 0.5, display: 'block' }}>Email</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{currentUser.email}</Typography>
            </Box>
            <Box>
              <Typography variant="caption" sx={{ color: '#8d6e63', mb: 0.5, display: 'block' }}>Department</Typography>
              <Typography variant="body2" sx={{ fontWeight: 500 }}>{currentUser.department}</Typography>
            </Box>
          </Box>
        </Stack>

        {/* 底部按钮区域 */}
        <Stack spacing={2} sx={{ mt: 4 }}>
          {/* 预留设置按钮 */}
          <Button 
            variant="outlined" 
            startIcon={<SettingsIcon />}
            sx={{ 
              color: '#5d4037', 
              borderColor: 'rgba(139, 115, 85, 0.3)',
              borderRadius: '12px'
            }}
          >
            Account Settings
          </Button>

          {/* 注销按钮 */}
          <Button 
            variant="contained" 
            color="error" 
            startIcon={<LogoutIcon />}
            onClick={handleLogout}
            sx={{ 
              borderRadius: '12px', 
              backgroundColor: '#ff8a65',
              boxShadow: 'none',
              '&:hover': { backgroundColor: '#ff7043' }
            }}
          >
            Sign Out
          </Button>
        </Stack>
      </Drawer>
    </>
  );
}