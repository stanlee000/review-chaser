import React, { useState, useEffect } from 'react';
import {
  Box,
  Container,
  Typography,
  TextField,
  Button,
  Paper,
  Grid,
  MenuItem,
  CircularProgress,
  Rating,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Divider,
  Alert,
  Stepper,
  Step,
  StepLabel,
  Checkbox,
  FormControlLabel,
  Stack,
  IconButton,
  Tooltip,
  Chip,
  FormGroup,
  FormControl,
  FormLabel,
  FormHelperText,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import SendIcon from '@mui/icons-material/Send';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import DeleteIcon from '@mui/icons-material/Delete';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import ErrorIcon from '@mui/icons-material/Error';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StarIcon from '@mui/icons-material/Star';
import TrustpilotIcon from '@mui/icons-material/Verified';
import CapterraIcon from '@mui/icons-material/AppRegistration';
import GoogleIcon from '@mui/icons-material/Google';
import G2Icon from '@mui/icons-material/Business';
import YelpIcon from '@mui/icons-material/Store';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import { useNavigate } from 'react-router-dom';

const SCREENSHOT_API_KEY = '41bf0a'; // You'll need to replace this with your actual key

const PLATFORM_URL_TEMPLATES = {
  trustpilot: {
    prefix: 'www.trustpilot.com/review/',
    placeholder: 'company-name'
  },
  capterra: {
    prefix: 'www.capterra.com/p/',
    placeholder: 'product-id/product-name'
  },
  google: {
    prefix: 'business.google.com/',
    placeholder: 'business-id'
  },
  g2: {
    prefix: 'www.g2.com/products/',
    placeholder: 'product-slug'
  },
  yelp: {
    prefix: 'www.yelp.com/biz/',
    placeholder: 'business-name'
  }
};

const PLATFORM_ICONS = {
  trustpilot: TrustpilotIcon,
  capterra: CapterraIcon,
  google: GoogleIcon,
  g2: G2Icon,
  yelp: YelpIcon
};

const PLATFORM_COLORS = {
  trustpilot: '#00b67a',
  capterra: '#FF9D28',
  google: '#4285F4',
  g2: '#FF492C',
  yelp: '#FF1A1A'
};

const EmailVariableButton = ({ variable, icon, label, onClick }) => (
  <Tooltip title={`Insert ${label}`}>
    <Button
      size="small"
      variant="outlined"
      onClick={onClick}
      startIcon={icon}
      sx={{
        mr: 1,
        mb: 1,
        borderRadius: 2,
        textTransform: 'none',
        borderColor: 'grey.300',
        '&:hover': {
          borderColor: 'primary.main',
          bgcolor: 'primary.50',
        }
      }}
    >
      {label}
    </Button>
  </Tooltip>
);

const RegenerateButton = ({ onClick, loading }) => (
  <Tooltip title="Generate new AI version">
    <IconButton
      onClick={onClick}
      disabled={loading}
      sx={{
        ml: 1,
        color: 'primary.main',
        '&:hover': {
          color: '#FFB400',
          bgcolor: 'rgba(255, 180, 0, 0.1)',
        },
        '&.Mui-disabled': {
          color: 'grey.300',
        }
      }}
    >
      {loading ? (
        <CircularProgress size={20} />
      ) : (
        <AutorenewIcon />
      )}
    </IconButton>
  </Tooltip>
);

const AIReviewGenerator = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [formData, setFormData] = useState({
    websiteUrl: '',
    reviewCount: 3,
    tone: 'Professional',
    additionalContext: '',
    customerName: '',
    productName: '',
    serviceType: '',
    keyPoints: '',
    reviewPlatforms: {
      trustpilot: { enabled: true, profileUrl: '' },
      capterra: { enabled: true, profileUrl: '' },
      google: { enabled: true, profileUrl: '' },
      g2: { enabled: false, profileUrl: '' },
      yelp: { enabled: false, profileUrl: '' }
    }
  });
  const [analysisResult, setAnalysisResult] = useState(null);
  const [generatedReviews, setGeneratedReviews] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  const [emailTemplate, setEmailTemplate] = useState({
    fromName: 'ReviewChaser',
    fromEmail: 'review@reviewchaser.com',
    subject: '💫 Share Your Experience with {productName}',
    content: `Hi {customerName},

We hope you're having a great experience with {productName}! Your feedback is incredibly valuable in helping us improve and helping others make informed decisions.

We've made it super easy - here's a suggested review you can use as a starting point:

"{reviewContent}"

 {incentive}

Thank you for being an awesome customer!

Cheers`,
    incentive: "As a token of our appreciation, we'll send you a special 15% discount code for your next purchase once you submit your review."
  });

  const [selectedReviews, setSelectedReviews] = useState([]);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [recipientData, setRecipientData] = useState({
    toName: '',
    toEmail: '',
  });
  const [selectedPlatforms, setSelectedPlatforms] = useState({
    trustpilot: false,
    capterra: false,
    google: false,
    g2: false,
    yelp: false,
  });
  const [sendingStatus, setSendingStatus] = useState(null);
  const [regenerating, setRegenerating] = useState({
    incentive: false,
    content: false
  });

  const steps = ['Website Analysis', 'Context Building', 'Review Generation', 'Send Review Requests'];

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
        setProfileLoading(false);
        return;
      }

      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('business_profiles')
          .select('website, analysis_data, platform_urls, additional_context, email_settings')
          .eq('user_id', user.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') {
          throw dbError;
        }

        if (data) {
          console.log("Fetched profile data:", data);
          setFormData(prev => ({
            ...prev,
            websiteUrl: data.website || prev.websiteUrl,
            additionalContext: data.additional_context || prev.additionalContext,
            reviewPlatforms: data.platform_urls ? 
              Object.entries(data.platform_urls).reduce((acc, [key, value]) => {
                  acc[key] = { enabled: !!value.profileUrl, profileUrl: value.profileUrl || '' };
                  return acc;
              }, {}) 
              : prev.reviewPlatforms,
            tone: data.email_settings?.tone || prev.tone,
            productName: data.analysis_data?.productName || prev.productName,
          }));

          if (data.analysis_data) {
            setAnalysisResult(data.analysis_data);
            setActiveStep(1);
          } else {
            setActiveStep(0);
          }

          if (data.email_settings) {
             setEmailTemplate(prev => ({
               ...prev,
               fromName: data.email_settings.fromName || prev.fromName,
               fromEmail: data.email_settings.fromEmail || prev.fromEmail,
               subject: data.email_settings.subject || prev.subject,
               content: data.email_settings.content || prev.content,
               incentive: data.email_settings.incentive || prev.incentive,
             }));
          }
        } else {
           setActiveStep(0);
        }

      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfileError('Failed to load saved settings. Please try again.');
        setActiveStep(0);
      } finally {
        setProfileLoading(false);
      }
    };

    fetchProfile();
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleEmailTemplateChange = (e) => {
    const { name, value } = e.target;
    setEmailTemplate(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleRecipientDataChange = (e) => {
    const { name, value } = e.target;
    setRecipientData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handlePlatformChange = (platform) => {
    setSelectedPlatforms(prev => ({
      ...prev,
      [platform]: !prev[platform]
    }));
  };

  const handlePlatformUrlChange = (platform, value) => {
    const fullUrl = value ? `https://${PLATFORM_URL_TEMPLATES[platform].prefix}${value}` : '';
    
    setFormData(prev => ({
      ...prev,
      reviewPlatforms: {
        ...prev.reviewPlatforms,
        [platform]: {
          ...prev.reviewPlatforms[platform],
          profileUrl: fullUrl
        }
      }
    }));
  };

  const handleAnalyzeWebsite = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/analyze-website', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url: formData.websiteUrl }),
      });

      if (!response.ok) {
        throw new Error('Failed to analyze website');
      }

      const data = await response.json();
      
      const updatedPlatforms = { ...formData.reviewPlatforms };
      Object.entries(data.reviewPlatforms || {}).forEach(([platform, info]) => {
        if (info.profileUrl) {
          updatedPlatforms[platform] = {
            ...updatedPlatforms[platform],
            profileUrl: info.profileUrl
          };
        }
      });

      setFormData(prev => ({
        ...prev,
        reviewPlatforms: updatedPlatforms
      }));
      
      setAnalysisResult(data);
      setActiveStep(1);
    } catch (error) {
      setError(
        'Unable to analyze the website. This could be due to website restrictions or connection issues. Please try a different URL or try again later.'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleContextBuilding = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/build-context', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          analysisResult,
          additionalContext: formData.additionalContext
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to build context');
      }

      const data = await response.json();
      setAnalysisResult(prev => ({
        ...prev,
        context: data.context
      }));
      setActiveStep(2);
    } catch (error) {
      console.error('Error building context:', error);
      setError('Failed to build context. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateReviews = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch('http://localhost:3001/api/generate-reviews', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          analysisResult
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate reviews');
      }

      const data = await response.json();
      setGeneratedReviews(data.reviews);
      setActiveStep(3);
    } catch (error) {
      console.error('Error generating reviews:', error);
      setError('Failed to generate reviews. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleReviewSelection = (reviewId) => {
    setSelectedReviews(prev => {
      if (prev.includes(reviewId)) {
        return prev.filter(id => id !== reviewId);
      }
      return [...prev, reviewId];
    });
  };

  const handleOpenEmailDialog = (review) => {
    const validPlatforms = Object.entries(formData.reviewPlatforms).reduce((acc, [platform, info]) => ({
      ...acc,
      [platform]: Boolean(info.profileUrl || (analysisResult?.reviewPlatforms?.[platform]?.profileUrl))
    }), {});
    
    setSelectedPlatforms(validPlatforms);
    setCurrentReview(review);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setCurrentReview(null);
    setRecipientData({
      toName: '',
      toEmail: '',
    });
    setSendingStatus(null);
  };

  const handleSendReviewRequest = async () => {
    if (!currentReview || !recipientData.toEmail || !recipientData.toName) {
      setError('Please fill in all required fields');
      return;
    }

    setLoading(true);
    setError(null);
    setSendingStatus('sending');

    try {
      const platforms = Object.entries(selectedPlatforms)
        .filter(([platform, selected]) => selected && formData.reviewPlatforms[platform].profileUrl)
        .map(([platform]) => ({
          id: platform,
          profileUrl: formData.reviewPlatforms[platform].profileUrl
        }));

      const reviewRequest = {
        reviewContent: currentReview.content,
        productName: analysisResult.productName || formData.productName,
        rating: currentReview.rating,
        title: currentReview.title || `Review for ${analysisResult.productName || formData.productName}`,
      };

      const emailData = {
        toName: recipientData.toName,
        toEmail: recipientData.toEmail,
        fromName: emailTemplate.fromName,
        fromEmail: emailTemplate.fromEmail,
        subject: emailTemplate.subject,
        content: emailTemplate.content,
        incentive: emailTemplate.incentive,
        platforms,
      };

      const response = await fetch('http://localhost:3001/api/send-review-request', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          reviewRequest,
          emailData,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to send review request');
      }

      const data = await response.json();
      setSendingStatus('success');
      setSuccessMessage(`Review request sent successfully to ${recipientData.toEmail}`);
      
      setTimeout(() => {
        handleCloseEmailDialog();
      }, 2000);
    } catch (error) {
      console.error('Error sending review request:', error);
      setError('Failed to send review request. Please try again.');
      setSendingStatus('error');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setActiveStep((prevStep) => prevStep - 1);
  };

  const toneOptions = [
    'Professional',
    'Casual',
    'Enthusiastic',
    'Critical',
    'Balanced'
  ];

  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Enter your product or landing page URL for AI analysis
            </Typography>
            <TextField
              fullWidth
              label="Website URL"
              name="websiteUrl"
              value={formData.websiteUrl}
              onChange={handleInputChange}
              margin="normal"
              required
              placeholder="https://example.com/product"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleAnalyzeWebsite}
              disabled={loading || !formData.websiteUrl}
              startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <EditIcon />}
              sx={{
                py: 1.5,
                borderRadius: 2,
                backgroundColor: 'primary.main',
                '&:hover': {
                  backgroundColor: 'primary.dark',
                },
              }}
            >
              {loading ? 'Analyzing...' : 'Analyze Website'}
            </Button>
          </Box>
        );

      case 1:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Review the analysis and add additional context
            </Typography>
            {analysisResult && (
              <Paper 
                elevation={0}
                sx={{ 
                  p: 3,
                  mb: 3,
                  bgcolor: '#FFFFFF',
                  borderRadius: 3,
                  border: '1px solid',
                  borderColor: 'grey.200'
                }}
              >
                <Typography variant="h6" gutterBottom sx={{ mb: 3, fontWeight: 600 }}>
                  Analysis Results
                </Typography>

                <Grid container spacing={6}>
                  <Grid item xs={12}>
                    <Box
                      sx={{
                        width: '100%',
                        height: 200,
                        borderRadius: 2,
                        overflow: 'hidden',
                        border: '1px solid',
                        borderColor: 'grey.200',
                        mb: 1,
                        position: 'relative',
                        bgcolor: 'grey.50',
                        width: '265px',
                        height: '200px'
                      }}
                    >
                      <Box
                        id="loading-state"
                        sx={{
                          position: 'absolute',
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          justifyContent: 'center',
                          bgcolor: 'grey.50',
                          zIndex: 1,
                        }}
                      >
                        <CircularProgress size={40} sx={{ mb: 2 }} />
                        <Typography variant="body2" color="text.secondary">
                          Generating preview...
                        </Typography>
                      </Box>
                      <img
                        src={`https://api.screenshotmachine.com/?key=${SCREENSHOT_API_KEY}&url=${encodeURIComponent(formData.websiteUrl)}&dimension=1024x768&device=desktop&format=png&cacheLimit=0&delay=2000&zoom=100`}
                        alt="Website Preview"
                        style={{
                          width: '100%',
                          height: '100%',
                          objectFit: 'cover',
                          position: 'relative',
                          zIndex: 2,
                          opacity: 0,
                          transition: 'opacity 0.3s ease-in-out'
                        }}
                        onLoad={(e) => {
                          const loadingState = document.getElementById('loading-state');
                          if (loadingState) {
                            loadingState.style.display = 'none';
                          }
                          e.target.style.opacity = '1';
                        }}
                        onError={(e) => {
                          const loadingState = document.getElementById('loading-state');
                          if (loadingState) {
                            loadingState.style.display = 'none';
                          }
                          e.target.src = 'data:image/svg+xml;charset=UTF-8,' + encodeURIComponent(`
                            <svg width="200" height="200" viewBox="0 0 200 200" fill="none" xmlns="http://www.w3.org/2000/svg">
                              <rect width="200" height="200" fill="#FEE4E2"/>
                              <text x="50%" y="50%" text-anchor="middle" fill="#D92D20" font-family="Arial" font-size="14">
                                Unable to load preview
                              </text>
                            </svg>
                          `);
                          e.target.style.opacity = '1';
                        }}
                      />
                    </Box>
                    <Typography 
                      variant="caption" 
                      color="text.secondary" 
                      sx={{ 
                        display: 'block',
                        mb: 3
                      }}
                    >
                      {formData.websiteUrl}
                    </Typography>
                  </Grid>

                  <Grid item xs={12}>
                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Basic Information
                      </Typography>
                      <Stack spacing={2}>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Product
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {analysisResult.productName}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Industry
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {analysisResult.industry}
                          </Typography>
                        </Box>
                        <Box>
                          <Typography variant="caption" color="text.secondary">
                            Target Audience
                          </Typography>
                          <Typography variant="body1" sx={{ fontWeight: 500 }}>
                            {analysisResult.targetAudience}
                          </Typography>
                        </Box>
                      </Stack>
                    </Box>

                    <Box sx={{ mb: 4 }}>
                      <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                        Unique Selling Points
                      </Typography>
                      <Stack spacing={1}>
                        {analysisResult.uniqueSellingPoints.map((point, index) => (
                          <Box
                            key={index}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              border: '1px solid',
                              borderColor: 'grey.200'
                            }}
                          >
                            <Typography variant="body2">
                              {point}
                            </Typography>
                          </Box>
                        ))}
                      </Stack>
                    </Box>
                  </Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Key Features
                    </Typography>
                    <Stack spacing={1}>
                      {analysisResult.features.map((feature, index) => (
                        <Box
                          key={index}
                          sx={{
                            p: 2,
                            borderRadius: 2,
                            bgcolor: 'grey.50',
                            border: '1px solid',
                            borderColor: 'grey.200',
                            display: 'flex',
                            alignItems: 'center',
                            gap: 1
                          }}
                        >
                          <CheckCircleIcon sx={{ color: 'success.main', fontSize: 20 }} />
                          <Typography variant="body2">
                            {feature}
                          </Typography>
                        </Box>
                      ))}
                    </Stack>
                  </Grid>
                </Grid>

                <Grid>
                  <Grid item xs={12}>
                    <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                      Review Platform Links
                    </Typography>
                    <Stack spacing={2}>
                      {Object.entries(analysisResult.reviewPlatforms || {}).map(([platform, info]) => {
                        const PlatformIcon = PLATFORM_ICONS[platform];
                        return (
                          <Box
                            key={platform}
                            sx={{
                              p: 2,
                              borderRadius: 2,
                              bgcolor: info.detected ? 'success.50' : 'grey.50',
                              border: '1px solid',
                              borderColor: info.detected ? 'success.200' : 'grey.200'
                            }}
                          >
                            <Stack spacing={1}>
                              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                <PlatformIcon 
                                  sx={{ 
                                    color: PLATFORM_COLORS[platform],
                                    fontSize: 24
                                  }} 
                                />
                                <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>
                                  {platform}
                                </Typography>
                                {info.detected ? (
                                  <Chip 
                                    label="Detected" 
                                    size="small" 
                                    color="success"
                                    sx={{ height: 20, ml: 'auto' }}
                                  />
                                ) : (
                                  <Chip 
                                    label="Not detected" 
                                    size="small" 
                                    variant="outlined"
                                    sx={{ height: 20, ml: 'auto' }}
                                  />
                                )}
                              </Box>
                              <TextField
                                size="small"
                                fullWidth
                                placeholder={PLATFORM_URL_TEMPLATES[platform].placeholder}
                                value={formData.reviewPlatforms[platform].profileUrl ? 
                                  formData.reviewPlatforms[platform].profileUrl.split(PLATFORM_URL_TEMPLATES[platform].prefix)[1] || '' :
                                  info.profileUrl ? info.profileUrl.split(PLATFORM_URL_TEMPLATES[platform].prefix)[1] || '' : ''}
                                onChange={(e) => handlePlatformUrlChange(platform, e.target.value)}
                                InputProps={{
                                  startAdornment: (
                                    <Typography 
                                      variant="caption" 
                                      color="text.secondary" 
                                      sx={{ 
                                        bgcolor: 'grey.100',
                                        py: 0.5,
                                        px: 1,
                                        borderRadius: 1,
                                        mr: 1,
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: 0.5
                                      }}
                                    >
                                      <PlatformIcon 
                                        sx={{ 
                                          fontSize: 16,
                                          color: PLATFORM_COLORS[platform]
                                        }} 
                                      />
                                      {PLATFORM_URL_TEMPLATES[platform].prefix}
                                    </Typography>
                                  ),
                                }}
                              />
                            </Stack>
                          </Box>
                        );
                      })}
                    </Stack>
                  </Grid>
                </Grid>
              </Paper>
            )}
            <TextField
              fullWidth
              label="Additional Context"
              name="additionalContext"
              value={formData.additionalContext}
              onChange={handleInputChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="Add any specific details or context you want to include in the reviews"
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleContextBuilding}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Processing...' : 'Build Context'}
            </Button>
          </Box>
        );

      case 2:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Configure review generation settings
            </Typography>
            <TextField
              select
              fullWidth
              label="Tone"
              name="tone"
              value={formData.tone}
              onChange={handleInputChange}
              margin="normal"
              sx={{ mb: 2 }}
            >
              {toneOptions.map((option) => (
                <MenuItem key={option} value={option}>
                  {option}
                </MenuItem>
              ))}
            </TextField>
            <TextField
              fullWidth
              type="number"
              label="Number of Reviews"
              name="reviewCount"
              value={formData.reviewCount}
              onChange={handleInputChange}
              margin="normal"
              InputProps={{ inputProps: { min: 1, max: 10 } }}
              sx={{ mb: 2 }}
            />
            <Button
              fullWidth
              variant="contained"
              onClick={handleGenerateReviews}
              disabled={loading}
              startIcon={loading ? <CircularProgress size={20} /> : <EditIcon />}
              sx={{ py: 1.5 }}
            >
              {loading ? 'Generating...' : 'Generate Reviews'}
            </Button>
          </Box>
        );

      case 3:
        return (
          <Box>
            <Typography variant="body2" color="text.secondary" paragraph>
              Use generated reviews or send requests to customers to leave reviews on your favorite platforms using customizable email templates
            </Typography>
            <Button
              variant="outlined"
              onClick={() => setShowEmailTemplate(!showEmailTemplate)}
              startIcon={<MailOutlineIcon />}
              sx={{
                py: 1,
                px: 3,
                borderRadius: 50,
                textTransform: 'none',
                mb: 3,
              }}
            >
              {showEmailTemplate ? 'Hide Email Template' : 'Customize Email Template'}
            </Button>

            {showEmailTemplate && (
              <Paper
                elevation={0}
                sx={{
                  p: 3,
                  borderRadius: 3,
                  bgcolor: '#f8f9fa',
                  border: '1px solid',
                  borderColor: 'divider',
                  mb: 3,
                }}
              >
                <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>
                  Email Template
                </Typography>
                <Grid container spacing={3}>
                  <Grid item xs={12} md={6}>
                    <TextField
                      fullWidth
                      label="From Name"
                      name="fromName"
                      value="Norman Finance"
                      disabled
                      sx={{ mb: 2, bgcolor: 'grey.50' }}
                    />
                    <TextField
                      fullWidth
                      label="From Email"
                      name="fromEmail"
                      value="customer@normanfinance.com"
                      disabled
                      sx={{ mb: 2, bgcolor: 'grey.50' }}
                    />
                    <TextField
                      fullWidth
                      label="Subject"
                      name="subject"
                      value={emailTemplate.subject}
                      onChange={handleEmailTemplateChange}
                      sx={{ mb: 2 }}
                    />
                  </Grid>
                  <Grid item xs={12} md={6}>
                    <Box sx={{ mb: 3 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Incentive Message
                        </Typography>
                        <RegenerateButton
                          onClick={() => handleRegenerateContent('incentive')}
                          loading={regenerating.incentive}
                        />
                      </Box>
                      <TextField
                        fullWidth
                        name="incentive"
                        value={emailTemplate.incentive}
                        onChange={handleEmailTemplateChange}
                        placeholder="Offer an incentive for leaving a review"
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            borderRadius: 2,
                          }
                        }}
                      />
                    </Box>

                    <Box sx={{ mb: 2 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                        <Typography variant="subtitle2" color="text.secondary">
                          Email Content
                        </Typography>
                        <RegenerateButton
                          onClick={() => handleRegenerateContent('content')}
                          loading={regenerating.content}
                        />
                      </Box>
                      
                      <Box sx={{ mb: 2 }}>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Available Variables:
                        </Typography>
                        <EmailVariableButton
                          variable="customerName"
                          icon={<PersonIcon />}
                          label="Customer Name"
                          onClick={() => insertVariable('customerName')}
                        />
                        <EmailVariableButton
                          variable="productName"
                          icon={<ShoppingBagIcon />}
                          label="Product Name"
                          onClick={() => insertVariable('productName')}
                        />
                        <EmailVariableButton
                          variable="reviewContent"
                          icon={<FormatQuoteIcon />}
                          label="Review Content"
                          onClick={() => insertVariable('reviewContent')}
                        />
                        <EmailVariableButton
                          variable="incentive"
                          icon={<LocalOfferIcon />}
                          label="Incentive"
                          onClick={() => insertVariable('incentive')}
                        />
                        <EmailVariableButton
                          variable="fromName"
                          icon={<InsertEmoticonIcon />}
                          label="From Name"
                          onClick={() => insertVariable('fromName')}
                        />
                      </Box>

                      <TextField
                        id="emailContent"
                        fullWidth
                        multiline
                        rows={8}
                        name="content"
                        value={emailTemplate.content}
                        onChange={handleEmailTemplateChange}
                        sx={{
                          '& .MuiOutlinedInput-root': {
                            fontFamily: 'monospace',
                            fontSize: '0.9rem',
                            lineHeight: 1.6,
                            '& fieldset': {
                              borderColor: 'grey.300',
                            },
                            '&:hover fieldset': {
                              borderColor: 'primary.main',
                            },
                            '&.Mui-focused fieldset': {
                              borderColor: 'primary.main',
                            },
                          },
                        }}
                      />
                    </Box>
                  </Grid>
                </Grid>
              </Paper>
            )}

            {generatedReviews.length > 0 ? (
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {generatedReviews.map((review, index) => (
                  <Card key={index}>
                    <CardHeader
                      avatar={
                        <Avatar sx={{ bgcolor: `hsl(${index * 137.5}, 70%, 50%)` }}>
                          {review.authorName.charAt(0)}
                        </Avatar>
                      }
                      title={review.title || `Review ${index + 1}`}
                      subheader={`${review.authorName} from ${review.location}`}
                      action={
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleOpenEmailDialog(review)}
                          startIcon={<SendIcon />}
                        >
                          Send Request
                        </Button>
                      }
                    />
                    <CardContent>
                      <Box sx={{ mb: 1 }}>
                        <Rating value={review.rating} readOnly precision={0.5} />
                      </Box>
                      <Typography variant="body2" color="text.secondary">
                        {review.content}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                        Posted on {new Date(review.date).toLocaleDateString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ))}
              </Box>
            ) : (
              <Typography variant="body2" color="text.secondary">
                No reviews generated yet. Go back to the previous step to generate reviews.
              </Typography>
            )}
          </Box>
        );

      default:
        return null;
    }
  };

  const handleRegenerateContent = async (type) => {
    setRegenerating(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch('/api/generate-email-content', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          type,
          productName: analysisResult?.productName || formData.productName,
          context: analysisResult?.context || ''
        }),
      });

      if (!response.ok) throw new Error('Failed to generate content');

      const data = await response.json();
      setEmailTemplate(prev => ({
        ...prev,
        [type]: data.content
      }));
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate new content. Please try again.');
    } finally {
      setRegenerating(prev => ({ ...prev, [type]: false }));
    }
  };

  const insertVariable = (variable) => {
    const field = document.getElementById('emailContent');
    if (!field) return;

    const start = field.selectionStart;
    const end = field.selectionEnd;
    const text = field.value;
    const before = text.substring(0, start);
    const after = text.substring(end);

    setEmailTemplate(prev => ({
      ...prev,
      content: before + `{${variable}}` + after
    }));

    setTimeout(() => {
      field.focus();
      field.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 0);
  };

  return (
    <Box sx={{ 
      minHeight: '100vh',
      bgcolor: '#f8f9fa'
    }}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Button 
          startIcon={<ArrowBackIcon />}
          onClick={() => navigate('/')}
          sx={{ mb: 2, textTransform: 'none' }} 
        >
          Back to Dashboard
        </Button>

        <Paper 
          elevation={0} 
          sx={{ 
            p: { xs: 2, sm: 4 }, 
            borderRadius: 4,
            background: 'linear-gradient(145deg, #ffffff 0%, #f8f9fa 100%)',
            border: '1px solid',
            borderColor: 'grey.100'
          }}
        >
          <Typography 
            variant="h4" 
            gutterBottom 
            sx={{ 
              mb: 4, 
              fontWeight: 700,
              background: 'linear-gradient(45deg, #2196F3 30%, #1565C0 90%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent'
            }}
          >
            Review Chaser
          </Typography>

          {profileLoading && (
             <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}><CircularProgress /></Box>
          )}
          {profileError && (
             <Alert severity="error" sx={{ mb: 3 }}>{profileError}</Alert>
          )}
          
          {!profileLoading && (
             <>
               <Stepper 
                 activeStep={activeStep} 
                 sx={{ 
                   mb: 6,
                   '& .MuiStepLabel-root .Mui-completed': {
                     color: 'primary.main',
                   },
                   '& .MuiStepLabel-label.Mui-completed.MuiStepLabel-alternativeLabel': {
                     color: 'grey.700',
                   },
                   '& .MuiStepLabel-root .Mui-active': {
                     color: 'primary.main',
                   },
                 }}
               >
                 {steps.map((label) => (
                   <Step key={label}>
                     <StepLabel>{label}</StepLabel>
                   </Step>
                 ))}
               </Stepper>

               <Box sx={{ maxWidth: '90%', mx: 'auto' }}>
                 {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
                 {successMessage && <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>}

                 <Box sx={{ mb: 4 }}>
                   {getStepContent(activeStep)}
                 </Box>
               </Box>
             </>
          )}
        </Paper>

        <Dialog 
          open={emailDialogOpen} 
          onClose={handleCloseEmailDialog}
          maxWidth="md"
          fullWidth
          PaperProps={{
            sx: {
              borderRadius: 3,
              boxShadow: '0 8px 32px rgba(0,0,0,0.1)',
            }
          }}
        >
          <DialogTitle sx={{ 
            pb: 1,
            borderBottom: '1px solid',
            borderColor: 'grey.100',
            '& .MuiTypography-root': {
              fontSize: '1.5rem',
              fontWeight: 600
            }
          }}>
            Send Review Request
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {currentReview && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>
                  Selected Review
                </Typography>
                <Paper 
                  sx={{ 
                    p: 3,
                    bgcolor: '#f8f9fa',
                    borderRadius: 2,
                    border: '1px solid',
                    borderColor: 'grey.200'
                  }}
                >
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={currentReview.rating} readOnly size="small" sx={{ mr: 1 }} />
                    <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500 }}>
                      {currentReview.title || `Review for ${analysisResult?.productName || formData.productName}`}
                    </Typography>
                  </Box>
                  <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6 }}>
                    {currentReview.content}
                  </Typography>
                </Paper>
              </Box>
            )}

            <Grid container spacing={3}>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Name"
                  name="toName"
                  value={recipientData.toName}
                  onChange={handleRecipientDataChange}
                  required
                  placeholder="Customer name"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField
                  fullWidth
                  label="Recipient Email"
                  name="toEmail"
                  value={recipientData.toEmail}
                  onChange={handleRecipientDataChange}
                  required
                  placeholder="customer@example.com"
                  type="email"
                  sx={{
                    '& .MuiOutlinedInput-root': {
                      borderRadius: 2
                    }
                  }}
                />
              </Grid>
            </Grid>

            <Box sx={{ mt: 4 }}>
              <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
                <FormLabel component="legend">Select Review Platforms</FormLabel>
                <FormGroup>
                  {Object.entries(formData.reviewPlatforms).map(([platform, info]) => {
                    const platformUrl = info.profileUrl || analysisResult?.reviewPlatforms?.[platform]?.profileUrl;
                    return platformUrl ? (
                      <FormControlLabel
                        key={platform}
                        control={
                          <Checkbox
                            checked={selectedPlatforms[platform]}
                            onChange={(e) => handlePlatformChange(platform)}
                          />
                        }
                        label={
                          <Box>
                            <Typography variant="body1" component="span">
                              {platform.charAt(0).toUpperCase() + platform.slice(1)}
                            </Typography>
                            <Typography variant="caption" display="block" color="text.secondary">
                              {platformUrl}
                            </Typography>
                          </Box>
                        }
                      />
                    ) : null;
                  })}
                </FormGroup>
                <FormHelperText>Select the platforms to include in the review request email</FormHelperText>
              </FormControl>
            </Box>

            {sendingStatus === 'sending' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'primary.50' 
              }}>
                <CircularProgress size={20} sx={{ mr: 2 }} />
                <Typography>Sending review request...</Typography>
              </Box>
            )}

            {sendingStatus === 'success' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'success.50',
                color: 'success.main'
              }}>
                <CheckCircleIcon sx={{ mr: 2 }} />
                <Typography>Review request sent successfully!</Typography>
              </Box>
            )}

            {sendingStatus === 'error' && (
              <Box sx={{ 
                display: 'flex', 
                alignItems: 'center', 
                mt: 3,
                p: 2,
                borderRadius: 2,
                bgcolor: 'error.50',
                color: 'error.main'
              }}>
                <ErrorIcon sx={{ mr: 2 }} />
                <Typography>Failed to send review request. Please try again.</Typography>
              </Box>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
            <Button 
              onClick={handleCloseEmailDialog}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3
              }}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleSendReviewRequest} 
              variant="contained" 
              disabled={loading || sendingStatus === 'sending'}
              sx={{ 
                borderRadius: 2,
                textTransform: 'none',
                px: 3,
                boxShadow: 2
              }}
            >
              Send Request
            </Button>
          </DialogActions>
        </Dialog>
      </Container>
    </Box>
  );
};

export default AIReviewGenerator; 