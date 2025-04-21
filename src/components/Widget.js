import React, { useState } from 'react';
import {
  Box,
  Typography,
  TextField,
  Button,
  Paper,
  MenuItem,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';

const Widget = () => {
  const [settings, setSettings] = useState({
    position: 'Bottom Right',
    color: '#1976d2',
    title: 'Leave a Review',
    subtitle: 'Help us improve by sharing your experience'
  });

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setSettings(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const positions = [
    'Bottom Right',
    'Bottom Left',
    'Top Right',
    'Top Left'
  ];

  const handleGenerateCode = () => {
    // Implementation for generating widget code
    console.log('Generating widget code with settings:', settings);
  };

  return (
    <Box sx={{ 
      py: 3,
      px: 4,
      bgcolor: '#f8f9fa',
      minHeight: '100vh',
      display: 'flex',
      gap: 3
    }}>
      {/* Widget Settings */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          borderRadius: 3,
          bgcolor: '#fff',
          flex: 2
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Widget Settings
        </Typography>

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
          {/* Position */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Position
            </Typography>
            <TextField
              select
              fullWidth
              name="position"
              value={settings.position}
              onChange={handleInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            >
              {positions.map((position) => (
                <MenuItem key={position} value={position}>
                  {position}
                </MenuItem>
              ))}
            </TextField>
          </Box>

          {/* Widget Color */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Widget Color
            </Typography>
            <TextField
              fullWidth
              type="color"
              name="color"
              value={settings.color}
              onChange={handleInputChange}
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                },
                '& .MuiOutlinedInput-input': {
                  p: 1,
                  height: 40
                }
              }}
            />
          </Box>

          {/* Widget Title */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Widget Title
            </Typography>
            <TextField
              fullWidth
              name="title"
              value={settings.title}
              onChange={handleInputChange}
              placeholder="Enter widget title"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>

          {/* Widget Subtitle */}
          <Box>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
              Widget Subtitle
            </Typography>
            <TextField
              fullWidth
              name="subtitle"
              value={settings.subtitle}
              onChange={handleInputChange}
              placeholder="Enter widget subtitle"
              sx={{
                '& .MuiOutlinedInput-root': {
                  borderRadius: 2,
                }
              }}
            />
          </Box>
        </Box>

        <Button
          variant="contained"
          onClick={handleGenerateCode}
          startIcon={<CodeIcon />}
          sx={{
            mt: 4,
            py: 1.5,
            px: 3,
            borderRadius: 2,
            textTransform: 'none',
            bgcolor: '#1976d2',
            '&:hover': {
              bgcolor: '#1565c0',
            }
          }}
        >
          Generate Widget Code
        </Button>
      </Paper>

      {/* Embed Code */}
      <Paper 
        elevation={0} 
        sx={{ 
          p: 3,
          borderRadius: 3,
          bgcolor: '#fff',
          flex: 1
        }}
      >
        <Typography variant="h5" sx={{ mb: 3, fontWeight: 600 }}>
          Embed Code
        </Typography>
        <Box 
          sx={{ 
            p: 2,
            borderRadius: 2,
            bgcolor: '#f8f9fa',
            border: '1px solid',
            borderColor: 'divider',
            minHeight: 200
          }}
        >
          <Typography variant="body2" color="text.secondary">
            Generated code will appear here
          </Typography>
        </Box>
      </Paper>
    </Box>
  );
};

export default Widget; 