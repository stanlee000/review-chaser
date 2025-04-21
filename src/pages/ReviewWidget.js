import React, { useState } from 'react';
import {
  Box,
  Typography,
  Button,
  Card,
  CardContent,
  Container,
  Grid,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Switch,
  FormControlLabel,
  Alert,
  Snackbar,
} from '@mui/material';
import CodeIcon from '@mui/icons-material/Code';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const ReviewWidget = () => {
  const [widgetConfig, setWidgetConfig] = useState({
    title: 'Customer Reviews',
    layout: 'grid',
    showRating: true,
    showDate: true,
    showAvatar: true,
    maxReviews: 6,
    theme: 'light',
  });

  const [embedCode, setEmbedCode] = useState('');

  const [widgetSettings, setWidgetSettings] = useState({
    color: '#1976d2',
    position: 'bottom-right',
    buttonText: 'Leave a Review',
    thanksMessage: 'Thank you for your feedback!'
  });

  const handleConfigChange = (e) => {
    const { name, value, checked } = e.target;
    setWidgetConfig((prev) => ({
      ...prev,
      [name]: e.target.type === 'checkbox' ? checked : value,
    }));
  };

  const handleSettingChange = (setting) => (event) => {
    setWidgetSettings(prev => ({
      ...prev,
      [setting]: event.target.value
    }));
  };

  const generateEmbedCode = () => {
    const code = `<div id="reviewranger-widget" 
  data-title="${widgetConfig.title}"
  data-layout="${widgetConfig.layout}"
  data-show-rating="${widgetConfig.showRating}"
  data-show-date="${widgetConfig.showDate}"
  data-show-avatar="${widgetConfig.showAvatar}"
  data-max-reviews="${widgetConfig.maxReviews}"
  data-theme="${widgetConfig.theme}">
</div>
<script src="https://reviewranger.io/widget.js"></script>`;
    
    setEmbedCode(code);
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Review Widget Configuration
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Customize and generate embed code for your review widget.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Widget Title"
                  name="title"
                  value={widgetConfig.title}
                  onChange={handleConfigChange}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Layout</InputLabel>
                  <Select
                    name="layout"
                    value={widgetConfig.layout}
                    onChange={handleConfigChange}
                    label="Layout"
                  >
                    <MenuItem value="grid">Grid</MenuItem>
                    <MenuItem value="list">List</MenuItem>
                    <MenuItem value="carousel">Carousel</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <FormControl fullWidth>
                  <InputLabel>Theme</InputLabel>
                  <Select
                    name="theme"
                    value={widgetConfig.theme}
                    onChange={handleConfigChange}
                    label="Theme"
                  >
                    <MenuItem value="light">Light</MenuItem>
                    <MenuItem value="dark">Dark</MenuItem>
                    <MenuItem value="custom">Custom</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  type="number"
                  label="Maximum Reviews"
                  name="maxReviews"
                  value={widgetConfig.maxReviews}
                  onChange={handleConfigChange}
                  inputProps={{ min: 1, max: 12 }}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.showRating}
                      onChange={handleConfigChange}
                      name="showRating"
                    />
                  }
                  label="Show Rating"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.showDate}
                      onChange={handleConfigChange}
                      name="showDate"
                    />
                  }
                  label="Show Date"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={widgetConfig.showAvatar}
                      onChange={handleConfigChange}
                      name="showAvatar"
                    />
                  }
                  label="Show Avatar"
                />
              </Grid>
              <Grid item xs={12}>
                <Button
                  variant="contained"
                  startIcon={<CodeIcon />}
                  onClick={generateEmbedCode}
                  fullWidth
                >
                  Generate Embed Code
                </Button>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              Review Widget Settings
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Customize the appearance and behavior of the review widget.
            </Typography>

            <Grid container spacing={2}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Button Text"
                  value={widgetSettings.buttonText}
                  onChange={handleSettingChange('buttonText')}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="Thank You Message"
                  value={widgetSettings.thanksMessage}
                  onChange={handleSettingChange('thanksMessage')}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  fullWidth
                  type="color"
                  label="Widget Color"
                  value={widgetSettings.color}
                  onChange={handleSettingChange('color')}
                  InputLabelProps={{ shrink: true }}
                />
              </Grid>
              <Grid item xs={12} sm={6}>
                <TextField
                  select
                  fullWidth
                  label="Widget Position"
                  value={widgetSettings.position}
                  onChange={handleSettingChange('position')}
                  SelectProps={{
                    native: true
                  }}
                >
                  <option value="bottom-right">Bottom Right</option>
                  <option value="bottom-left">Bottom Left</option>
                  <option value="top-right">Top Right</option>
                  <option value="top-left">Top Left</option>
                </TextField>
              </Grid>
            </Grid>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Embed Code
              </Typography>
              {embedCode ? (
                <Box>
                  <Paper
                    sx={{
                      p: 2,
                      mb: 2,
                      bgcolor: 'grey.50',
                      fontFamily: 'monospace',
                      whiteSpace: 'pre-wrap',
                    }}
                  >
                    {embedCode}
                  </Paper>
                  <Button
                    variant="outlined"
                    startIcon={<ContentCopyIcon />}
                    onClick={copyToClipboard}
                    fullWidth
                    sx={{ mb: 2 }}
                  >
                    Copy to Clipboard
                  </Button>
                  <Alert severity="info">
                    Paste this code into your website where you want the reviews to appear.
                  </Alert>
                </Box>
              ) : (
                <Typography color="text.secondary" align="center">
                  Generate embed code to see it here
                </Typography>
              )}
            </CardContent>
          </Card>

          <Card sx={{ mt: 3 }}>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Preview
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: '1px dashed grey',
                  borderRadius: 1,
                  minHeight: 200,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Typography color="text.secondary">
                  Widget preview will appear here
                </Typography>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReviewWidget; 