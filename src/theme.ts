// src/theme.ts
'use client'; 

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    // 你的核心主色调（比如重要按钮的灰绿色）
    primary: { 
      main: '#6d8c7d', 
      dark: '#5a7568',
      contrastText: '#ffffff',
    },
    // 你的次要色调（比如辅助图标、浅棕色）
    secondary: { 
      main: '#8d6e63',
      dark: '#5d4037',
    },
    // 全局文字颜色
    text: {
      primary: '#4e342e',   // 深棕色用于主标题
      secondary: '#8d6e63', // 浅棕色用于辅助说明
    },
    // 全局背景色
    background: {
      default: '#fcfaf5',   // 整个系统底层的米白色
      paper: '#ffffff',     // 卡片和弹窗的纯白色
    }
  },
  typography: {
    fontFamily: 'var(--font-roboto), Arial, sans-serif',
  },
});

export default theme;