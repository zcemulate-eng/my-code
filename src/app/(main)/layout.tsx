'use client';

import * as React from 'react';
import { Box } from '@mui/material';
import Navbar from '@/components/Navbar'; // 确保这里引入了 Navbar

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {/* 1. 导航栏必须写在这里 */}
      <Navbar /> 
      
      {/* 2. 页面内容注入到 Box 中 */}
      <Box component="main" sx={{ p: 3, minHeight: '100vh' }}>
        {children}
      </Box>
    </>
  );
}