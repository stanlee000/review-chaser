import React, { useState } from 'react';
import { Box, Stepper, Step, StepLabel, Button, Typography, Container, TextField } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';

const steps = ['Business Information', 'Customize Widget', 'Review & Complete'];

export default function OnboardingFlow() {
  const [activeStep, setActiveStep] = useState(0);
  const [businessData, setBusinessData] = useState({
    name: '',
    website: '',
    industry: '',
    widgetColor: '#007bff',
    widgetPosition: 'bottom-right'
  });
  const navigate = useNavigate();
  const { user } = useAuth();

  const handleNext = () => {
    if (activeStep === steps.length - 1) {
      handleSubmit();
    } else {
      setActiveStep((prevStep) => prevStep + 1);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const handleSubmit = async () => {
    try {
      const { data, error } = await supabase
        .from('business_profiles')
        .insert([
          {
            user_id: user.id,
            business_name: businessData.name,
            website: businessData.website,
            industry: businessData.industry,
            widget_settings: {
              color: businessData.widgetColor,
              position: businessData.widgetPosition
            },
            onboarding_completed: true
          }
        ]);

      if (error) throw error;
      navigate('/dashboard');
    } catch (error) {
      console.error('Error saving business profile:', error);
    }
  };

  const handleInputChange = (field) => (event) => {
    setBusinessData(prev => ({
      ...prev,
      [field]: event.target.value
    }));
  };

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box sx={{ mt: 4 }}>
            <TextField
              fullWidth
              label="Business Name"
              value={businessData.name}
              onChange={handleInputChange('name')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Website"
              value={businessData.website}
              onChange={handleInputChange('website')}
              margin="normal"
              required
            />
            <TextField
              fullWidth
              label="Industry"
              value={businessData.industry}
              onChange={handleInputChange('industry')}
              margin="normal"
              required
            />
          </Box>
        );
      case 1:
        return (
          <Box sx={{ mt: 4 }}>
            <TextField
              fullWidth
              type="color"
              label="Widget Color"
              value={businessData.widgetColor}
              onChange={handleInputChange('widgetColor')}
              margin="normal"
            />
            <TextField
              fullWidth
              select
              label="Widget Position"
              value={businessData.widgetPosition}
              onChange={handleInputChange('widgetPosition')}
              margin="normal"
              SelectProps={{
                native: true,
              }}
            >
              <option value="bottom-right">Bottom Right</option>
              <option value="bottom-left">Bottom Left</option>
              <option value="top-right">Top Right</option>
              <option value="top-left">Top Left</option>
            </TextField>
          </Box>
        );
      case 2:
        return (
          <Box sx={{ mt: 4 }}>
            <Typography variant="h6" gutterBottom>
              Review Your Information
            </Typography>
            <Typography>Business Name: {businessData.name}</Typography>
            <Typography>Website: {businessData.website}</Typography>
            <Typography>Industry: {businessData.industry}</Typography>
            <Typography>Widget Color: {businessData.widgetColor}</Typography>
            <Typography>Widget Position: {businessData.widgetPosition}</Typography>
          </Box>
        );
      default:
        return 'Unknown step';
    }
  };

  return (
    <Container maxWidth="md">
      <Box sx={{ width: '100%', mt: 4 }}>
        <Stepper activeStep={activeStep}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>
        <Box sx={{ mt: 4 }}>
          {getStepContent(activeStep)}
          <Box sx={{ display: 'flex', justifyContent: 'flex-end', mt: 4 }}>
            <Button
              disabled={activeStep === 0}
              onClick={handleBack}
              sx={{ mr: 1 }}
            >
              Back
            </Button>
            <Button
              variant="contained"
              onClick={handleNext}
            >
              {activeStep === steps.length - 1 ? 'Complete' : 'Next'}
            </Button>
          </Box>
        </Box>
      </Box>
    </Container>
  );
} 