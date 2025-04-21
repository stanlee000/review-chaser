import React from 'react';
import { Link as RouterLink, useLocation, useNavigate } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  Container,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import WidgetsIcon from '@mui/icons-material/Widgets';
import SettingsIcon from '@mui/icons-material/Settings';
import SmartToyIcon from '@mui/icons-material/SmartToy';
import LogoutIcon from '@mui/icons-material/Logout';
import { useAuth } from '../contexts/AuthContext';

const Navbar = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { signOut, user } = useAuth();

  const navItems = [
    // { path: '/', label: 'Dashboard', icon: DashboardIcon },
    // { path: '/generator', label: 'Generator', icon: AutoFixHighIcon },
    // { path: '/widget', label: 'Widget', icon: WidgetsIcon },
    // { path: '/ai-reviews', label: 'AI Reviews', icon: SmartToyIcon },
  ];

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/auth');
    } catch (error) {
      console.error("Error signing out: ", error);
    }
  };

  return (
    <AppBar 
      position="sticky" 
      elevation={0}
      sx={{
        backgroundColor: 'background.paper',
        borderBottom: '1px solid',
        borderColor: 'divider',
      }}
    >
      <Container maxWidth="lg">
        <Toolbar sx={{ py: 1.5, px: '0 !important' }}>
          <Typography
            variant="h5"
            component={RouterLink}
            to="/"
            sx={{
              flexGrow: 1,
              textDecoration: 'none',
              color: '#2196F3',
              fontWeight: 700,
              letterSpacing: '-0.02em',
              display: 'flex',
              alignItems: 'center',
              fontSize: '1.5rem',
            }}
          >
            Review Chaser
          </Typography>
          <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
            {navItems.map((item) => (
              <Button
                key={item.path}
                component={RouterLink}
                to={item.path}
                startIcon={<item.icon />}
                sx={{
                  px: 2,
                  py: 1,
                  color: location.pathname === item.path ? 'primary.main' : 'text.secondary',
                  fontWeight: location.pathname === item.path ? 600 : 500,
                  '&:hover': {
                    backgroundColor: 'transparent',
                    color: 'primary.main',
                  },
                }}
              >
                {item.label}
              </Button>
            ))}
            <Button
              component={RouterLink}
              to="/settings"
              startIcon={<SettingsIcon />}
              sx={{
                px: 2,
                py: 1,
                color: location.pathname === '/settings' ? 'primary.main' : 'text.secondary',
                fontWeight: location.pathname === '/settings' ? 600 : 500,
                '&:hover': { backgroundColor: 'transparent', color: 'primary.main' },
              }}
            >
              Settings
            </Button>
            <Button
              color="inherit"
              startIcon={<LogoutIcon />}
              onClick={handleLogout}
              sx={{ 
                ml: 1,
                color: 'text.secondary',
                '&:hover': { backgroundColor: 'action.hover', color: 'error.main' }
              }}
            >
              Logout
            </Button>
          </Box>
        </Toolbar>
      </Container>
    </AppBar>
  );
};

export default Navbar; 