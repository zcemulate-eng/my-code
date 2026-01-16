'use client';

import {
  Typography,
  Grid, // MUI v6 推荐使用 Grid2
  Card,
  CardContent,
  Box,
  Container
} from '@mui/material';

export default function DashboardPage() {
    return (
        <Box>
            <Typography variant="h4" sx={{ fontWeight: 800, mb: 3 }}>
                概览 (Overview)
            </Typography>
        </Box>
    );
}