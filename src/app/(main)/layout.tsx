// src/app/(main)/layout.tsx
'use client';
import { useState } from 'react';
import { Box, Drawer, List, ListItem, ListItemButton, ListItemIcon, ListItemText, IconButton, Divider, Typography, useTheme } from '@mui/material';
import { 
    ChevronLeft as ChevronLeftIcon, Menu as MenuIcon, 
    Dashboard as DashboardIcon, Business as BusinessIcon, Person as PersonIcon 
} from '@mui/icons-material';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

const DRAWER_WIDTH = 280;

export default function MainLayout({ children }: { children: React.ReactNode }) {
    const [open, setOpen] = useState(true);
    const pathname = usePathname();
    const theme = useTheme();

    const toggleDrawer = () => setOpen(!open);

    // 【关键改动】：更新导航路径，现在它们是同级的
    const navItems = [
        { text: 'Dashboard', icon: <DashboardIcon />, path: '/dashboard' },
        { text: 'Companies', icon: <BusinessIcon />, path: '/companies' }, // 原来是 /dashboard/companies
        { text: 'User', icon: <PersonIcon />, path: '/user' },            // 原来是 /dashboard/user
    ];

    return (
        <Box sx={{ display: 'flex', minHeight: '100vh', backgroundColor: '#fcfaf5' }}>
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
                {/* 侧边栏头部 */}
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

            {/* 内容区域：所有 (main) 下的页面都会渲染在 children 里 */}
            <Box component="main" sx={{ flexGrow: 1, p: { xs: 2, md: 5 }, width: '100%' }}>
                {children}
            </Box>
        </Box>
    );
}