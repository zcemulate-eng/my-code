// src/app/(main)/layout.tsx
'use client';
import { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Divider, Typography, useTheme } from '@mui/material';
import { 
    Menu as MenuIcon, 
    Dashboard as DashboardIcon, Business as BusinessIcon, Person as PersonIcon 
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import TopBar from '@/components/Topbar'; // <--- 1. 引入 TopBar 组件

const DRAWER_WIDTH = 280;

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    const pathname = usePathname();
    const theme = useTheme();

    const toggleDrawer = () => setOpen(!open);

    const navItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Companies', icon: <BusinessIcon />, path: '/companies' },
        { text: 'User', icon: <PersonIcon />, path: '/users' },
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fcfaf5' }}>
            {/* --- 左侧：侧边栏 (Sidebar) --- */}
            <Drawer
                variant="permanent"
                open={open}
                sx={{
                    width: open ? DRAWER_WIDTH : 88,
                    flexShrink: 0,
                    '& .MuiDrawer-paper': {
                        width: open ? DRAWER_WIDTH : 88,
                        transition: theme.transitions.create('width', {
                            easing: theme.transitions.easing.sharp,
                            duration: theme.transitions.duration.enteringScreen,
                        }),
                        overflowX: 'hidden',
                        backgroundColor: '#fff',
                        borderRight: '1px dashed rgba(145, 158, 171, 0.2)',
                    },
                }}
            >
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: open ? 'space-between' : 'center', px: 2, py: 3 }}>
                    {open && <Typography variant="h6" sx={{ fontWeight: 800, color: '#5d4037' }}>MY SYSTEM</Typography>}
                    <IconButton onClick={toggleDrawer}><MenuIcon /></IconButton>
                </Box>

                <Divider sx={{ borderStyle: 'dashed', mb: 2 }} />

                <List sx={{ px: 2 }}>
                    {navItems.map((item) => {
                        const active = pathname === item.path;
                        return (
                            <ListItem key={item.text} disablePadding sx={{ display: 'block', mb: 1 }}>
                                <ListItemButton
                                    component={Link}
                                    href={item.path}
                                    sx={{
                                        minHeight: 48,
                                        justifyContent: open ? 'initial' : 'center',
                                        borderRadius: '12px',
                                        backgroundColor: active ? 'rgba(109, 140, 125, 0.08)' : 'transparent',
                                        color: active ? '#6d8c7d' : '#637381',
                                    }}
                                >
                                    <ListItemIcon sx={{ minWidth: 0, mr: open ? 3 : 'auto', justifyContent: 'center', color: 'inherit' }}>
                                        {item.icon}
                                    </ListItemIcon>
                                    <ListItemText primary={item.text} sx={{ opacity: open ? 1 : 0 }} />
                                </ListItemButton>
                            </ListItem>
                        );
                    })}
                </List>
            </Drawer>

            {/* --- 右侧：主区域 (包含 TopBar 和 页面内容) --- */}
            <Box 
                component="main" 
                sx={{ 
                    flexGrow: 1, 
                    width: '100%', 
                    display: 'flex',        // <--- 2. 改为 Flex 布局
                    flexDirection: 'column' // <--- 3. 垂直排列 (TopBar 在上，内容在下)
                }}
            >
                {/* A. 顶部栏 */}
                <TopBar />

                {/* B. 页面实际内容 */}
                <Box sx={{ 
                    flexGrow: 1, 
                    p: { xs: 2, md: 5 }, // <--- 4. Padding 移到这里，防止 TopBar 被挤压
                    overflow: 'auto'     // 内容过多时出现滚动条
                }}>
                    {children}
                </Box>
            </Box>
        </Box>
    );
}