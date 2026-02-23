// src/components/WelcomeModal.tsx
'use client';

import React, { useState, useEffect } from 'react';
import { 
    Dialog, DialogTitle, DialogContent, DialogActions, 
    Button, Avatar, Box, Typography, IconButton,
    Radio, RadioGroup, FormControlLabel, FormControl, FormLabel
} from '@mui/material';
import PhotoCameraIcon from '@mui/icons-material/PhotoCamera';
import WcIcon from '@mui/icons-material/Wc';
// 引入后端接口
import { getCurrentUser, completeFirstLogin } from '@/app/actions/auth'; 

export default function WelcomeModal() {
    const [open, setOpen] = useState(false);
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
    const [gender, setGender] = useState<string>('');

    useEffect(() => {
        // 向后端查询当前用户状态
        const checkUserStatus = async () => {
            const res = await getCurrentUser();
            if (res.success && res.data && res.data.isFirstLogin) {
                setOpen(true);
            }
        };
        checkUserStatus();
    }, []);

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const reader = new FileReader();
            reader.onload = (e) => setAvatarPreview(e.target?.result as string);
            reader.readAsDataURL(e.target.files[0]);
        }
    };

    const handleSave = async () => {
        // 增加等待状态或直接捕获结果
        const result = await completeFirstLogin({ avatarUrl: avatarPreview, gender });
        
        if (result.success) {
            setOpen(false);
            window.location.reload(); // 保存成功，安全刷新
        } else {
            alert(result.message || "保存失败，图片可能过大或网络异常");
        }
    };

    const handleSkip = async () => {
        const defaultAvatars = [
            '/static/avatars/cartoon-1.png', 
            '/static/avatars/cartoon-2.png'
        ];
        const randomAvatar = defaultAvatars[Math.floor(Math.random() * defaultAvatars.length)];
        
        const result = await completeFirstLogin({ avatarUrl: randomAvatar, gender: '' });
        
        if (result.success) {
            setOpen(false);
            window.location.reload(); 
        } else {
            alert("跳过失败，请重试");
        }
    };


    return (
        <Dialog 
            open={open} 
            disableEscapeKeyDown
            PaperProps={{ 
                sx: { 
                    borderRadius: '24px', 
                    p: 3, 
                    minWidth: '320px',
                    textAlign: 'center',
                    backgroundColor: 'rgba(255, 255, 255, 0.95)',
                    backdropFilter: 'blur(20px)',
                    boxShadow: '0 24px 48px rgba(93, 64, 55, 0.15)'
                } 
            }}
        >
            <DialogTitle sx={{ fontWeight: 900, color: '#4e342e', pb: 1, fontSize: '1.5rem' }}>
                欢迎加入我们！
            </DialogTitle>
            <DialogContent sx={{ pb: 1, overflowY: 'visible' }}>
                <Typography variant="body2" sx={{ color: '#8d6e63', mb: 4 }}>
                    请完善您的基本信息，开启专属体验
                </Typography>
                
                <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                    
                    {/* 1. 头像预览与上传按钮 */}
                    <Box sx={{ position: 'relative' }}>
                        <Avatar 
                            src={avatarPreview || undefined} 
                            sx={{ 
                                width: 110, height: 110, 
                                bgcolor: '#efebe9', 
                                color: '#a1887f',
                                border: '4px solid #fff',
                                boxShadow: '0 8px 24px rgba(141, 110, 99, 0.2)' 
                            }} 
                        />
                        <IconButton 
                            component="label" 
                            sx={{ 
                                position: 'absolute', bottom: 0, right: 0, 
                                bgcolor: '#6d8c7d', color: '#fff', 
                                border: '3px solid #fff',
                                width: 40, height: 40,
                                '&:hover': { bgcolor: '#5a7568' },
                                boxShadow: '0 4px 12px rgba(109, 140, 125, 0.4)'
                            }}
                        >
                            <PhotoCameraIcon fontSize="small" />
                            <input type="file" hidden accept="image/*" onChange={handleFileChange} />
                        </IconButton>
                    </Box>

                    {/* 2. 性别单选按钮区域 */}
                    <FormControl 
                        component="fieldset" 
                        sx={{ 
                            width: '100%', 
                            p: 2, 
                            borderRadius: '16px', 
                            backgroundColor: 'rgba(141, 110, 99, 0.04)',
                            border: '1px dashed rgba(141, 110, 99, 0.2)'
                        }}
                    >
                        <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 1, mb: 1.5 }}>
                            <WcIcon sx={{ color: '#8d6e63', fontSize: 20 }} />
                            <FormLabel sx={{ 
                                color: '#5d4037', fontWeight: 700, 
                                '&.Mui-focused': { color: '#5d4037' } 
                            }}>
                                您的性别
                            </FormLabel>
                        </Box>
                        
                        <RadioGroup
                            row
                            value={gender}
                            onChange={(e) => setGender(e.target.value)}
                            sx={{ justifyContent: 'center', gap: 2 }}
                        >
                            <FormControlLabel 
                                value="男" 
                                control={
                                    <Radio sx={{ 
                                        color: '#bcaaa4', 
                                        '&.Mui-checked': { color: '#6d8c7d' } 
                                    }} />
                                } 
                                label={<Typography sx={{ fontWeight: gender === '男' ? 700 : 500, color: gender === '男' ? '#4e342e' : '#8d6e63' }}>男生</Typography>} 
                            />
                            <FormControlLabel 
                                value="女" 
                                control={
                                    <Radio sx={{ 
                                        color: '#bcaaa4', 
                                        '&.Mui-checked': { color: '#6d8c7d' } 
                                    }} />
                                } 
                                label={<Typography sx={{ fontWeight: gender === '女' ? 700 : 500, color: gender === '女' ? '#4e342e' : '#8d6e63' }}>女生</Typography>} 
                            />
                        </RadioGroup>
                    </FormControl>

                </Box>
            </DialogContent>
            
            <DialogActions sx={{ justifyContent: 'center', pt: 3, pb: 2, gap: 2 }}>
                <Button 
                    onClick={handleSkip} 
                    sx={{ color: '#8d6e63', fontWeight: 'bold', borderRadius: '50px', px: 3 }}
                >
                    暂时跳过
                </Button>
                <Button 
                    onClick={handleSave} 
                    variant="contained" 
                    // 必须上传了头像并选择了性别才能点击“开启体验”
                    disabled={!avatarPreview || !gender} 
                    sx={{ 
                        bgcolor: '#6d8c7d', borderRadius: '50px', px: 4, fontWeight: 'bold',
                        boxShadow: '0 8px 20px rgba(109, 140, 125, 0.3)',
                        '&:hover': { bgcolor: '#5a7568', boxShadow: '0 10px 25px rgba(109, 140, 125, 0.4)' },
                        '&.Mui-disabled': { bgcolor: '#cfd8d4', color: '#fff', boxShadow: 'none' }
                    }}
                >
                    开启体验
                </Button>
            </DialogActions>
        </Dialog>
    );
}