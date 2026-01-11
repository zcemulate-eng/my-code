'use client';

import { 
  Typography, 
  Grid, // MUI v6 推荐使用 Grid2
  Card, 
  CardContent, 
  Box, 
  Container 
} from '@mui/material';

export default function HomePage() {
  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Typography variant="h4" gutterBottom fontWeight="700">
        欢迎回来，Richard
      </Typography>
      
      <Grid container spacing={3} sx={{ mt: 2 }}>
        {/* MUI v6 写法：使用 size 属性代替 xs/sm */}
        <Grid size={{ xs: 12, sm: 4 }}>
          <Card variant="outlined" sx={{ borderTop: '4px solid #1976d2' }}>
            <CardContent>
              <Typography color="text.secondary">活跃项目</Typography>
              <Typography variant="h4" fontWeight="bold">12</Typography>
            </CardContent>
          </Card>
        </Grid>
        {/* ... 其他卡片同理修改 size 属性 */}
      </Grid>
    </Container>
  );
}