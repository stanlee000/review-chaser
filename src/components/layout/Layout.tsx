import React from 'react';
import { Box, AppBar, Toolbar, Typography, Container, useTheme } from '@mui/material';
import { styled } from '@mui/material/styles';

const StyledAppBar = styled(AppBar)(({ theme }) => ({
  backgroundColor: 'transparent',
  boxShadow: 'none',
  borderBottom: `1px solid ${theme.palette.divider}`,
}));

const MainContent = styled(Box)(({ theme }) => ({
  minHeight: '100vh',
  paddingTop: theme.spacing(8),
  backgroundColor: theme.palette.background.default,
}));

interface LayoutProps {
  children: React.ReactNode;
}

export const Layout: React.FC<LayoutProps> = ({ children }) => {
  const theme = useTheme();

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <StyledAppBar position="fixed">
        <Toolbar>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1 }}>
            Review Chaser
          </Typography>
        </Toolbar>
      </StyledAppBar>
      <MainContent>
        <Container maxWidth="lg" sx={{ py: 4 }}>
          {children}
        </Container>
      </MainContent>
    </Box>
  );
}; 