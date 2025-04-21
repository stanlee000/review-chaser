import React, { useState, useEffect } from 'react';
import { Box, Container, Typography, TextField, Button, Paper, Snackbar } from '@mui/material';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

export default function WidgetGenerator() {
  const { user } = useAuth();
  const [widgetSettings, setWidgetSettings] = useState({
    color: '#007bff',
    position: 'bottom-right',
    buttonText: 'Leave a Review',
    thanksMessage: 'Thank you for your review!'
  });
  const [businessProfile, setBusinessProfile] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);

  useEffect(() => {
    fetchBusinessProfile();
  }, []);

  const fetchBusinessProfile = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .select('*')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      
      if (data) {
        setBusinessProfile(data);
        setWidgetSettings(prev => ({
          ...prev,
          ...data.widget_settings
        }));
      }
    } catch (error) {
      console.error('Error fetching business profile:', error);
    }
  };

  const handleSettingChange = (field) => (event) => {
    setWidgetSettings(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const saveSettings = async () => {
    try {
      const { error } = await supabase
        .from('business_profiles')
        .update({
          widget_settings: widgetSettings
        })
        .eq('user_id', user.id);

      if (error) throw error;
      setSnackbarOpen(true);
    } catch (error) {
      console.error('Error saving widget settings:', error);
    }
  };

  const generateWidgetCode = () => {
    const encodedSettings = encodeURIComponent(JSON.stringify(widgetSettings));
    const businessId = businessProfile?.id;
    
    return `
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    script.setAttribute('data-business-id', '${businessId}');
    script.setAttribute('data-settings', '${encodedSettings}');
    document.head.appendChild(script);
  })();
</script>
    `.trim();
  };

  const copyWidgetCode = () => {
    navigator.clipboard.writeText(generateWidgetCode());
    setSnackbarOpen(true);
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ mt: 4 }}>
        <Typography variant="h4" gutterBottom>
          Widget Generator
        </Typography>
        
        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Customize Your Widget
          </Typography>
          
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              label="Button Text"
              value={widgetSettings.buttonText}
              onChange={handleSettingChange('buttonText')}
              fullWidth
            />
            
            <TextField
              label="Thank You Message"
              value={widgetSettings.thanksMessage}
              onChange={handleSettingChange('thanksMessage')}
              fullWidth
            />
            
            <TextField
              type="color"
              label="Widget Color"
              value={widgetSettings.color}
              onChange={handleSettingChange('color')}
              fullWidth
            />
            
            <TextField
              select
              label="Widget Position"
              value={widgetSettings.position}
              onChange={handleSettingChange('position')}
              fullWidth
              SelectProps={{
                native: true,
              }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </TextField>
            
            <Button
              variant="contained"
              onClick={saveSettings}
              sx={{ mt: 2 }}
            >
              Save Settings
            </Button>
          </Box>
        </Paper>

        <Paper sx={{ p: 3, mt: 3 }}>
          <Typography variant="h6" gutterBottom>
            Widget Code
          </Typography>
          
          <TextField
            multiline
            rows={6}
            value={generateWidgetCode()}
            fullWidth
            InputProps={{
              readOnly: true,
            }}
          />
          
          <Button
            variant="contained"
            onClick={copyWidgetCode}
            sx={{ mt: 2 }}
          >
            Copy Code
          </Button>
        </Paper>
      </Box>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message="Action completed successfully"
      />
    </Container>
  );
} 