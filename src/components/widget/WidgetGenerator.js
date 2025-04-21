import React, { useState, useEffect } from 'react';
import {
  Box,
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Snackbar,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
} from '@mui/material';
import { supabase } from '../../lib/supabase';

const WidgetGenerator = () => {
  const [settings, setSettings] = useState({
    position: 'bottom-right',
    color: '#0066FF',
    title: 'Leave a Review',
    subtitle: 'Help us improve by sharing your experience',
  });
  const [widgetCode, setWidgetCode] = useState('');
  const [snackbar, setSnackbar] = useState({
    open: false,
    message: '',
    severity: 'success',
  });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data, error } = await supabase
        .from('business_profiles')
        .select('widget_settings')
        .eq('user_id', user.id)
        .single();

      if (error) throw error;
      if (data?.widget_settings) {
        setSettings(data.widget_settings);
      }
    } catch (error) {
      console.error('Error loading widget settings:', error);
    }
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setSettings((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const generateWidgetCode = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      
      // Save widget settings
      const { error } = await supabase
        .from('business_profiles')
        .update({ widget_settings: settings })
        .eq('user_id', user.id);

      if (error) throw error;

      // Generate widget embed code
      const code = `
<script>
  (function() {
    var script = document.createElement('script');
    script.src = '${window.location.origin}/widget.js';
    script.async = true;
    script.dataset.reviewranger = '${user.id}';
    script.dataset.position = '${settings.position}';
    script.dataset.color = '${settings.color}';
    script.dataset.title = '${settings.title}';
    script.dataset.subtitle = '${settings.subtitle}';
    document.head.appendChild(script);
  })();
</script>`;

      setWidgetCode(code);
      setSnackbar({
        open: true,
        message: 'Widget code generated successfully!',
        severity: 'success',
      });
    } catch (error) {
      console.error('Error generating widget:', error);
      setSnackbar({
        open: true,
        message: 'Error generating widget code',
        severity: 'error',
      });
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    setSnackbar({
      open: true,
      message: 'Widget code copied to clipboard!',
      severity: 'success',
    });
  };

  return (
    <Box>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Widget Settings
              </Typography>
              <Box sx={{ mt: 2 }}>
                <FormControl fullWidth sx={{ mb: 3 }}>
                  <InputLabel>Position</InputLabel>
                  <Select
                    name="position"
                    value={settings.position}
                    onChange={handleChange}
                  >
                    <MenuItem value="bottom-right">Bottom Right</MenuItem>
                    <MenuItem value="bottom-left">Bottom Left</MenuItem>
                    <MenuItem value="top-right">Top Right</MenuItem>
                    <MenuItem value="top-left">Top Left</MenuItem>
                  </Select>
                </FormControl>

                <TextField
                  fullWidth
                  label="Widget Color"
                  name="color"
                  type="color"
                  value={settings.color}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Widget Title"
                  name="title"
                  value={settings.title}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                />

                <TextField
                  fullWidth
                  label="Widget Subtitle"
                  name="subtitle"
                  value={settings.subtitle}
                  onChange={handleChange}
                  sx={{ mb: 3 }}
                />

                <Button
                  variant="contained"
                  onClick={generateWidgetCode}
                  fullWidth
                >
                  Generate Widget Code
                </Button>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card elevation={0} sx={{ height: '100%' }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Embed Code
              </Typography>
              {widgetCode && (
                <Box sx={{ mt: 2 }}>
                  <TextField
                    fullWidth
                    multiline
                    rows={8}
                    value={widgetCode}
                    InputProps={{
                      readOnly: true,
                    }}
                    sx={{ mb: 2, fontFamily: 'monospace' }}
                  />
                  <Button
                    variant="outlined"
                    onClick={copyToClipboard}
                    fullWidth
                  >
                    Copy to Clipboard
                  </Button>
                </Box>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default WidgetGenerator; 