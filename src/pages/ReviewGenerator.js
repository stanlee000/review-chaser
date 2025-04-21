import React, { useState } from 'react';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
} from '@mui/material';
import AutoFixHighIcon from '@mui/icons-material/AutoFixHigh';
import SendIcon from '@mui/icons-material/Send';

const ReviewGenerator = () => {
  const [formData, setFormData] = useState({
    customerName: '',
    productName: '',
    serviceType: '',
    tone: 'professional',
    keyPoints: '',
  });

  const [generatedReview, setGeneratedReview] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      // Mock API call - replace with actual OpenAI API integration
      await new Promise((resolve) => setTimeout(resolve, 2000));
      
      const mockGeneratedReview = `I recently had the pleasure of experiencing ${formData.productName} and I must say, it exceeded all my expectations. The ${formData.serviceType} was exceptional, and the attention to detail was remarkable. I would highly recommend this to anyone looking for quality service.`;
      
      setGeneratedReview(mockGeneratedReview);
    } catch (err) {
      setError('Failed to generate review. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container maxWidth="lg" sx={{ mt: 4, mb: 4 }}>
      <Grid container spacing={3}>
        <Grid item xs={12} md={6}>
          <Paper sx={{ p: 3 }}>
            <Typography variant="h5" gutterBottom>
              AI Review Chaser
            </Typography>
            <Typography variant="body1" color="text.secondary" paragraph>
              Generate personalized review requests using AI technology.
            </Typography>
            
            <form onSubmit={handleSubmit}>
              <Grid container spacing={2}>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Customer Name"
                    name="customerName"
                    value={formData.customerName}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Product/Service Name"
                    name="productName"
                    value={formData.productName}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Service Type"
                    name="serviceType"
                    value={formData.serviceType}
                    onChange={handleInputChange}
                    required
                  />
                </Grid>
                <Grid item xs={12}>
                  <FormControl fullWidth>
                    <InputLabel>Tone</InputLabel>
                    <Select
                      name="tone"
                      value={formData.tone}
                      onChange={handleInputChange}
                      label="Tone"
                    >
                      <MenuItem value="professional">Professional</MenuItem>
                      <MenuItem value="casual">Casual</MenuItem>
                      <MenuItem value="friendly">Friendly</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
                <Grid item xs={12}>
                  <TextField
                    fullWidth
                    label="Key Points to Include"
                    name="keyPoints"
                    value={formData.keyPoints}
                    onChange={handleInputChange}
                    multiline
                    rows={3}
                    placeholder="Enter key points you'd like to emphasize in the review"
                  />
                </Grid>
                <Grid item xs={12}>
                  <Button
                    type="submit"
                    variant="contained"
                    size="large"
                    startIcon={loading ? <CircularProgress size={20} /> : <AutoFixHighIcon />}
                    disabled={loading}
                    fullWidth
                  >
                    {loading ? 'Generating...' : 'Generate Review'}
                  </Button>
                </Grid>
              </Grid>
            </form>
          </Paper>
        </Grid>

        <Grid item xs={12} md={6}>
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Generated Review
              </Typography>
              {error && (
                <Alert severity="error" sx={{ mb: 2 }}>
                  {error}
                </Alert>
              )}
              {generatedReview ? (
                <Box>
                  <Paper sx={{ p: 2, mb: 2, bgcolor: 'grey.50' }}>
                    <Typography variant="body1">{generatedReview}</Typography>
                  </Paper>
                  <Button
                    variant="contained"
                    color="primary"
                    startIcon={<SendIcon />}
                    fullWidth
                  >
                    Send Review Request
                  </Button>
                </Box>
              ) : (
                <Typography color="text.secondary" align="center">
                  Generated review will appear here
                </Typography>
              )}
            </CardContent>
          </Card>
        </Grid>
      </Grid>
    </Container>
  );
};

export default ReviewGenerator; 