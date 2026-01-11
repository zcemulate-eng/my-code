// src/theme.ts
'use client'; // 必须有这一行，否则会触发图 1 的 Functions cannot be passed 错误

import { createTheme } from '@mui/material/styles';

const theme = createTheme({
  palette: {
    mode: 'light',
    primary: { main: '#1976d2' },
  },
  typography: {
    fontFamily: 'var(--font-roboto), Arial, sans-serif',
  },
});

export default theme;