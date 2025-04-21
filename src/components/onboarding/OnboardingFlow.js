import React, { useState, useEffect } from 'react';
import {
  Box,
  Stepper,
  Step,
  StepLabel,
  Button,
  Typography,
  Container,
  Paper,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  FormControlLabel,
  Switch,
  CircularProgress,
  Alert,
  Grid,
  Stack,
  Chip,
  Card,
  CardContent,
  CardHeader,
  Avatar,
  Rating,
  IconButton,
  Tooltip,
  Dialog, DialogTitle, DialogContent, DialogActions,
  Checkbox, FormGroup, FormLabel, FormHelperText,
  List, ListItem, ListItemIcon, ListItemText
} from '@mui/material';
import { useNavigate, useLocation } from 'react-router-dom';
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../contexts/AuthContext';

// --- Import Icons and Platform data (similar to AIReviewGenerator) ---
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import TrustpilotIcon from '@mui/icons-material/Verified'; 
import CapterraIcon from '@mui/icons-material/AppRegistration';
import GoogleIcon from '@mui/icons-material/Google';
import G2Icon from '@mui/icons-material/Business';
import YelpIcon from '@mui/icons-material/Store';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import SendIcon from '@mui/icons-material/Send';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ErrorIcon from '@mui/icons-material/Error';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import BookmarkBorderIcon from '@mui/icons-material/BookmarkBorder';
import BookmarkIcon from '@mui/icons-material/Bookmark';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';

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

// Assuming PLATFORM_URL_TEMPLATES is needed for display
const PLATFORM_URL_TEMPLATES = {
  trustpilot: { prefix: 'https://www.trustpilot.com/review/', placeholder: 'company-name' },
  capterra: { prefix: 'https://www.capterra.com/p/', placeholder: 'id/slug' },
  google: { prefix: 'https://business.google.com/', placeholder: 'id' }, // Adjust if needed
  g2: { prefix: 'https://www.g2.com/products/', placeholder: 'slug' },
  yelp: { prefix: 'https://www.yelp.com/biz/', placeholder: 'name' }
};

// --- Screenshot Machine API Key (Replace with your actual key!) ---
const SCREENSHOT_MACHINE_API_KEY = process.env.REACT_APP_SCREENSHOT_MACHINE_API_KEY;

const steps = [
  'Business Info',
  'Website Analysis',
  'Refine Context',
  'Review Generation',
  'Finalize',
];

const OnboardingFlow = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [activeStep, setActiveStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const [savedReviewIds, setSavedReviewIds] = useState([]);

  const [formData, setFormData] = useState({
    companyName: location.state?.companyName || '',
    website: '',
    additionalContext: '',
    tone: 'Professional',
    reviewCount: 3,
  });

  const [analysisResult, setAnalysisResult] = useState(null);
  const [platformData, setPlatformData] = useState({});
  const [generatedReviews, setGeneratedReviews] = useState([]);

  // --- State for Email Template & Sending --- 
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [emailTemplate, setEmailTemplate] = useState({
    fromName: 'ReviewChaser',
    fromEmail: 'review@reviewchaser.com',
    subject: '💫 Share Your Experience with {productName}',
    content: `Hi {customerName},\n\nWe hope you're having a great experience with {productName}! Your feedback is incredibly valuable...\n\nSuggested review:\n"{reviewContent}"\n\n{incentive}\n\nThank you!\n\nCheers`,
    incentive: "As a token of our appreciation, we'll send you a special 15% discount code..."
  });
  const [regeneratingEmail, setRegeneratingEmail] = useState({ incentive: false, content: false });
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [recipientData, setRecipientData] = useState({ toName: '', toEmail: '' });
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [sendingStatus, setSendingStatus] = useState(null);

  useEffect(() => {
    if (location.state?.companyName) {
      setFormData(prev => ({ ...prev, companyName: location.state.companyName }));
    }
  }, [location.state?.companyName]);

  const generateReviews = async () => {
    setSavedReviewIds([]);
    setError(null);
    const loadingSetter = activeStep === 2 ? setLoading : setIsRegenerating;
    loadingSetter(true);
    try {
      const payload = {
        websiteUrl: formData.website,
        reviewCount: formData.reviewCount,
        tone: formData.tone,
        additionalContext: formData.additionalContext,
        analysisResult: {
          ...analysisResult,
          reviewPlatforms: Object.entries(platformData).reduce((acc, [key, value]) => {
            acc[key] = { detected: value.detected, profileUrl: value.profileUrl };
            return acc;
          }, {}),
        },
        productName: analysisResult?.productName || formData.companyName,
      };

      const response = await fetch('http://localhost:3001/api/generate-reviews', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || 'Failed to generate reviews');
      }
      const data = await response.json();
      setGeneratedReviews(data.reviews || []);
      return true;
    } catch (err) {
      setError(err.message || 'An error occurred during review generation.');
      return false;
    } finally {
      loadingSetter(false);
    }
  };

  const handleNext = async () => {
    setError(null);
    if (activeStep === 0) {
      if (!formData.website) {
        setError('Please enter your website URL.');
        return;
      }
      setLoading(true);
      try {
        const response = await fetch('http://localhost:3001/api/analyze-website', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url: formData.website }),
        });
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || 'Failed to analyze website');
        }
        const data = await response.json();
        setAnalysisResult(data);
        const initialPlatformData = {};
        Object.entries(PLATFORM_ICONS).forEach(([platform]) => {
          const info = data.reviewPlatforms?.[platform];
          initialPlatformData[platform] = {
            profileUrl: info?.profileUrl || '',
            detected: info?.detected || false
          };
        });
        setPlatformData(initialPlatformData);
        setActiveStep((prev) => prev + 1);
      } catch (err) {
        setError(err.message || 'An error occurred during analysis.');
      } finally {
        setLoading(false);
      }
      return;
    }

    if (activeStep === 2) {
      const success = await generateReviews();
      if (success) {
        setActiveStep((prev) => prev + 1);
      }
      return;
    }

    if (activeStep === steps.length - 1) {
      setLoading(true);
      try {
        if (!user) throw new Error("User not found");

        const savedReviewsToPersist = generatedReviews.filter((_, index) => savedReviewIds.includes(index));

        const profileData = {
          user_id: user.id,
          business_name: formData.companyName,
          website: formData.website,
          onboarding_completed: true,
          analysis_data: analysisResult,
          platform_urls: platformData,
          additional_context: formData.additionalContext,
          generated_reviews: savedReviewsToPersist,
          email_settings: {
            ...emailTemplate,
          }
        };

        const { data: existingProfile, error: fetchError } = await supabase
          .from('business_profiles')
          .select('user_id')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fetchError && fetchError.code !== 'PGRST116') {
          throw fetchError;
        }

        let upsertError;
        if (existingProfile) {
            const { error } = await supabase
                .from('business_profiles')
                .update(profileData)
                .eq('user_id', user.id);
            upsertError = error;
        } else {
            const { error } = await supabase
                .from('business_profiles')
                .insert(profileData);
            upsertError = error;
        }

        if (upsertError) throw upsertError;

        navigate('/');
      } catch (err) {
        console.error('Error saving onboarding data:', err);
        setError('Failed to save onboarding progress. Please try again.');
      } finally {
        setLoading(false);
      }
    } else {
      setActiveStep((prev) => prev + 1);
    }
  };

  const handleBack = () => {
    setError(null);
    setActiveStep((prev) => prev - 1);
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === 'checkbox' || type === 'switch' ? checked : value,
    }));
  };
  
  const handlePlatformUrlChange = (platform, value) => {
    const template = PLATFORM_URL_TEMPLATES[platform];
    const fullUrl = value ? `${template.prefix}${value}` : '';
    setPlatformData(prev => ({
        ...prev,
        [platform]: { ...prev[platform], profileUrl: fullUrl }
    }));
  };

  const handleSkip = async () => {
      setLoading(true);
      setError(null);
      try {
          if (!user) throw new Error("User not found");
          const { error } = await supabase
              .from('business_profiles')
              .upsert({ user_id: user.id, onboarding_completed: true }, { onConflict: 'user_id' });

          if (error) throw error;
          navigate('/');
      } catch (err) {
          console.error('Error skipping onboarding:', err);
          setError('Failed to skip onboarding. Please try again.');
      } finally {
          setLoading(false);
      }
  };

  // --- Email Template Handlers (copied/adapted from AIReviewGenerator) ---
  const handleEmailTemplateChange = (e) => {
    const { name, value } = e.target;
    setEmailTemplate(prev => ({ ...prev, [name]: value }));
  };

  const handleRecipientDataChange = (e) => {
    const { name, value } = e.target;
    setRecipientData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformDialogChange = (platform) => {
    setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleOpenEmailDialog = (review) => {
    setCurrentReview(review);
    const initialSelected = Object.entries(platformData)
      .filter(([_, info]) => info.profileUrl)
      .reduce((acc, [platform]) => ({ ...acc, [platform]: true }), {});
    setSelectedPlatforms(initialSelected);
    setRecipientData({ toName: '', toEmail: '' });
    setSendingStatus(null);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setCurrentReview(null);
    setRecipientData({ toName: '', toEmail: '' });
    setSendingStatus(null);
  };

  const handleSendReviewRequest = async () => {
    if (!currentReview || !recipientData.toEmail || !recipientData.toName) {
      setError('Please fill in recipient name and email.');
      setSendingStatus('error'); 
      return;
    }

    setSendingStatus('sending');
    setError(null);
    setSuccessMessage(null);

    try {
      const platformsToSend = Object.entries(selectedPlatforms)
        .filter(([platform, selected]) => selected && platformData[platform]?.profileUrl)
        .map(([platform]) => ({ id: platform, profileUrl: platformData[platform].profileUrl }));

      const reviewRequest = {
        reviewContent: currentReview.content,
        productName: analysisResult?.productName || formData.companyName,
        rating: currentReview.rating,
        title: currentReview.title || `Review for ${analysisResult?.productName || formData.companyName}`,
      };

      const emailData = {
        toName: recipientData.toName,
        toEmail: recipientData.toEmail,
        fromName: emailTemplate.fromName,
        fromEmail: emailTemplate.fromEmail,
        subject: emailTemplate.subject,
        content: emailTemplate.content,
        incentive: emailTemplate.incentive,
        platforms: platformsToSend,
      };

      const response = await fetch('http://localhost:3001/api/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewRequest, emailData }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to send review request');
      }

      setSendingStatus('success');
      setSuccessMessage(`Review request sent successfully to ${recipientData.toEmail}`);
      
      setTimeout(() => { handleCloseEmailDialog(); }, 2500);

    } catch (err) {
      console.error('Error sending review request:', err);
      setError(err.message || 'Failed to send review request. Please try again.');
      setSendingStatus('error');
    } 
  };

  const handleRegenerateContent = async (type) => {
    setRegeneratingEmail(prev => ({ ...prev, [type]: true }));
    try {
      const response = await fetch('/api/generate-email-content', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ type, productName: analysisResult?.productName || formData.companyName, context: analysisResult?.context || '' }),
      });
      if (!response.ok) throw new Error('Failed to generate content');
      const data = await response.json();
      setEmailTemplate(prev => ({ ...prev, [type]: data.content }));
    } catch (error) {
      console.error('Error generating content:', error);
      setError('Failed to generate new email content. Please try again.');
    } finally {
      setRegeneratingEmail(prev => ({ ...prev, [type]: false }));
    }
  };

  const insertVariable = (variable) => {
    const field = document.getElementById('onboardingEmailContent');
    if (!field) return;
    const start = field.selectionStart;
    const end = field.selectionEnd;
    const text = field.value;
    const before = text.substring(0, start);
    const after = text.substring(end);
    const newText = before + `{${variable}}` + after;
    setEmailTemplate(prev => ({ ...prev, content: newText }));
    setTimeout(() => {
      field.focus();
      field.setSelectionRange(start + variable.length + 2, start + variable.length + 2);
    }, 0);
  };

  // --- DEFINE Helper Components Inside --- 
  const EmailVariableButton = ({ variable, icon, label, onClick }) => (
      <Tooltip title={`Insert ${label}`}>
      <Button
          size="small" variant="outlined" onClick={onClick} startIcon={icon}
          sx={{ mr: 1, mb: 1, borderRadius: 2, textTransform: 'none', borderColor: 'grey.300', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}
      >
          {label}
      </Button>
      </Tooltip>
  );

  const RegenerateButton = ({ onClick, loading }) => (
      <Tooltip title="Generate new AI version">
      <IconButton
          onClick={onClick} disabled={loading}
          sx={{ ml: 1, color: 'primary.main', '&:hover': { color: '#FFB400', bgcolor: 'rgba(255, 180, 0, 0.1)' }, '&.Mui-disabled': { color: 'grey.300' } }}
      >
          {loading ? <CircularProgress size={20} /> : <AutorenewIcon />}
      </IconButton>
      </Tooltip>
  );
  // ---------------------------------------

  // --- Handler to toggle saving a review ---
  const handleToggleSaveReview = (reviewIndex) => {
    setSavedReviewIds(prev => 
      prev.includes(reviewIndex) 
        ? prev.filter(id => id !== reviewIndex) // Remove if exists
        : [...prev, reviewIndex] // Add if doesn't exist
    );
  };

  // --- GET STEP CONTENT --- 
  const getStepContent = (step) => {
    switch (step) {
      case 0:
        return (
          <Box>
            <Typography variant="h6" gutterBottom>Welcome! Let's Get Started</Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
              Tell us about your business to generate tailored review requests.
            </Typography>
            
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={formData.companyName}
              onChange={handleChange}
              margin="normal"
              required
              sx={{ mb: 2 }}
            />
             <TextField
              fullWidth
              label="Website URL"
              name="website"
              value={formData.website}
              onChange={handleChange}
              margin="normal"
              required
              placeholder="https://example.com"
              sx={{ mb: 3 }}
            />

            <Paper variant="outlined" sx={{ p: 3, mb: 3, borderRadius: 2, bgcolor: 'background.default' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>How This Works</Typography>
                <List disablePadding>
                    <ListItem disableGutters alignItems="flex-start">
                       <ListItemIcon sx={{ minWidth: 32, mt: 0.5, color: 'primary.main' }}><LooksOneIcon fontSize="small"/></ListItemIcon>
                       <ListItemText 
                          primary="Provide Business Context" 
                          secondary="Enter your website URL and later add platform links. The AI analyzes this to understand your business." 
                          primaryTypographyProps={{ fontWeight: 500 }}
                          secondaryTypographyProps={{ variant: 'body2' }}
                        />
                    </ListItem>
                     <ListItem disableGutters alignItems="flex-start">
                       <ListItemIcon sx={{ minWidth: 32, mt: 0.5, color: 'primary.main' }}><LooksTwoIcon fontSize="small"/></ListItemIcon>
                       <ListItemText 
                          primary="AI Generates Suggestions" 
                          secondary="Based on context, we generate review suggestions tailored to your tone and key features." 
                           primaryTypographyProps={{ fontWeight: 500 }}
                           secondaryTypographyProps={{ variant: 'body2' }}
                        />
                    </ListItem>
                     <ListItem disableGutters alignItems="flex-start">
                       <ListItemIcon sx={{ minWidth: 32, mt: 0.5, color: 'primary.main' }}><Looks3Icon fontSize="small"/></ListItemIcon>
                       <ListItemText 
                          primary="Send Review Requests" 
                          secondary="Select suggestions, customize emails (optional), and send them to your customers." 
                           primaryTypographyProps={{ fontWeight: 500 }}
                           secondaryTypographyProps={{ variant: 'body2' }}
                        />
                    </ListItem>
                </List>
             </Paper>
          </Box>
        );

      case 1:
        if (!analysisResult) {
          return <Typography>No analysis data available. Please go back.</Typography>;
        }
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom sx={{ mb: 3 }}>Website Analysis Results</Typography>
            
            {/* Website Preview Section */}
            <Typography variant="subtitle1" gutterBottom>Website Preview</Typography>
             <Box
                sx={{
                    width: '100%',
                    maxWidth: '400px', // Limit preview size
                    height: 250,
                    borderRadius: 2,
                    overflow: 'hidden',
                    border: '1px solid',
                    borderColor: 'grey.300',
                    mb: 1,
                    position: 'relative',
                    bgcolor: 'grey.100',
                }}
                >
                {/* Loading State Overlay */}
                <Box
                    id="onboarding-preview-loading"
                    sx={{
                    position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
                    display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
                    bgcolor: 'rgba(255, 255, 255, 0.8)', zIndex: 1,
                    }}
                >
                    <CircularProgress size={40} sx={{ mb: 2 }} />
                    <Typography variant="body2" color="text.secondary">Generating preview...</Typography>
                </Box>
                {/* Image Tag */}
                <img
                    src={`https://api.screenshotmachine.com/?key=${SCREENSHOT_MACHINE_API_KEY}&url=${encodeURIComponent(formData.website)}&dimension=1024x768&device=desktop&format=png&cacheLimit=0&delay=2000&zoom=100`}
                    alt="Website Preview"
                    style={{ width: '100%', height: '100%', objectFit: 'cover', position: 'relative', zIndex: 2, opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                    onLoad={(e) => {
                        const loadingState = document.getElementById('onboarding-preview-loading');
                        if (loadingState) loadingState.style.display = 'none';
                        e.target.style.opacity = '1';
                    }}
                    onError={(e) => {
                        const loadingState = document.getElementById('onboarding-preview-loading');
                        if (loadingState) loadingState.style.display = 'none';
                        // Simple text error state for now
                        e.target.style.opacity = '1';
                        e.target.alt = "Preview failed to load";
                        // Optionally set a placeholder SVG or hide the image
                    }}
                />
                </Box>
                 <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 3 }}>
                    {formData.website}
                </Typography>

            {/* Analysis Details Section */}
            <Grid container spacing={3}> 
              {/* Basic Info Display - Refined Styling */}
              <Grid item xs={12} md={6}>
                <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200', height: '100%' }}>
                  <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Basic Information</Typography>
                  <Stack spacing={2}>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">Product/Company</Typography>
                      <Typography sx={{ fontWeight: 500 }}>{analysisResult.productName || 'N/A'}</Typography>
                    </Box>
                     <Box>
                      <Typography variant="caption" display="block" color="text.secondary">Description</Typography>
                      <Typography>{analysisResult.description || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">Industry</Typography>
                      <Typography>{analysisResult.industry || 'N/A'}</Typography>
                    </Box>
                    <Box>
                      <Typography variant="caption" display="block" color="text.secondary">Target Audience</Typography>
                      <Typography>{analysisResult.targetAudience || 'N/A'}</Typography>
                    </Box>
                  </Stack>
                </Paper>
              </Grid>
              
              {/* Features & USP Display - Refined Styling */}
              <Grid item xs={12} md={6}>
                 <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200', mb: 2 }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Key Features</Typography>
                    <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {(analysisResult.features || []).map((feature, index) => (
                        <Chip key={index} label={feature} size="small" variant="outlined" icon={<CheckCircleIcon sx={{ fontSize: 16, marginLeft: '5px' }} />} />
                      ))}
                      {!(analysisResult.features?.length > 0) && <Typography variant="body2" color="text.secondary">N/A</Typography>}
                    </Stack>
                  </Paper>
                  <Paper elevation={0} sx={{ p: 3, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                    <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Unique Selling Points</Typography>
                     <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap">
                      {(analysisResult.uniqueSellingPoints || []).map((point, index) => (
                         <Chip key={index} label={point} size="small" variant="outlined" />
                      ))}
                      {!(analysisResult.uniqueSellingPoints?.length > 0) && <Typography variant="body2" color="text.secondary">N/A</Typography>}
                    </Stack>
                  </Paper>
              </Grid>

              {/* Review Platform Links Editor - (Keep previous implementation) */}
              <Grid item xs={12}>
                 <Typography variant="subtitle1" gutterBottom sx={{ mt: 2 }}>Review Platform Links</Typography>
                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                   We tried to detect your review profiles. Please verify or enter the correct profile IDs/slugs below.
                 </Typography>
                 <Stack spacing={2}>
                   {Object.entries(platformData).map(([platform, info]) => {
                     const PlatformIcon = PLATFORM_ICONS[platform];
                     const template = PLATFORM_URL_TEMPLATES[platform];
                     const currentValue = info.profileUrl ? info.profileUrl.replace(template.prefix, '') : '';
                     return (
                       <Paper key={platform} elevation={0} sx={{ p: 2, borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                         <Stack spacing={1}>
                           <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                             <PlatformIcon sx={{ color: PLATFORM_COLORS[platform], fontSize: 24 }} />
                             <Typography variant="subtitle2" sx={{ textTransform: 'capitalize' }}>{platform}</Typography>
                             {info.detected ? (
                               <Chip label="Detected" size="small" color="success" sx={{ height: 20, ml: 'auto' }} />
                             ) : (
                               <Chip label="Not detected" size="small" variant="outlined" sx={{ height: 20, ml: 'auto' }} />
                             )}
                           </Box>
                           <TextField
                             size="small" fullWidth placeholder={template.placeholder} value={currentValue}
                             onChange={(e) => handlePlatformUrlChange(platform, e.target.value)}
                             InputProps={{ startAdornment: (
                                 <Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, whiteSpace: 'nowrap' }}>{template.prefix}</Typography>
                             )}} />
                         </Stack>
                       </Paper>
                     );
                   })}
                 </Stack>
              </Grid>
            </Grid>
          </Box>
        );

      case 2:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>Refine Context</Typography>
             <TextField
               fullWidth
               label="Additional Context"
               name="additionalContext"
               value={formData.additionalContext}
               onChange={handleChange}
               margin="normal"
               multiline
               rows={4}
               placeholder="Add any specific details or context you want the AI to consider for reviews (e.g., specific customer types, recent product updates)"
               sx={{ mb: 2 }}
             />
          </Box>
        );

      case 3:
        return (
          <Box sx={{ py: 2 }}>
             <Typography variant="h6" gutterBottom>Review Generation</Typography>
              <TextField
                select
                fullWidth
                label="Tone"
                name="tone"
                value={formData.tone}
                onChange={handleChange}
                margin="normal"
                sx={{ mb: 2 }}
                disabled={isRegenerating}
              >
                {['Professional', 'Casual', 'Enthusiastic', 'Critical', 'Balanced'].map((option) => (
                  <MenuItem key={option} value={option}>{option}</MenuItem>
                ))}
              </TextField>
              <TextField
                fullWidth
                type="number"
                label="Number of Reviews to Generate"
                name="reviewCount"
                value={formData.reviewCount}
                onChange={handleChange}
                margin="normal"
                InputProps={{ inputProps: { min: 1, max: 10 } }}
                sx={{ mb: 2 }}
                disabled={isRegenerating}
              />
             
             <Box sx={{ display: 'flex', alignItems: 'center', mt: 3, mb: 1 }}>
                <Typography variant="h6" gutterBottom sx={{ mb: 0, flexGrow: 1 }}>
                    Generated Reviews
                </Typography>
                <Tooltip title="Regenerate Reviews">
                    <span>
                        <IconButton onClick={generateReviews} disabled={isRegenerating || loading} color="primary">
                            {isRegenerating ? <CircularProgress size={24} /> : <AutorenewIcon />}
                        </IconButton>
                    </span>
                </Tooltip>
             </Box>
             
             {isRegenerating && generatedReviews.length === 0 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>Generating...</Typography>
             )}
             
             {!isRegenerating && generatedReviews.length === 0 && activeStep === 3 && (
                <Typography color="text.secondary" sx={{ mt: 2 }}>Click Next or Regenerate to generate review suggestions.</Typography>
             )}

             {generatedReviews.length > 0 && (
                <Stack spacing={2} sx={{ mt: 2, opacity: isRegenerating ? 0.5 : 1, transition: 'opacity 0.3s' }}>
                  {generatedReviews.map((review, index) => {
                    const isSaved = savedReviewIds.includes(index);
                    return (
                     <Card key={index} variant="outlined">
                       <CardHeader
                         avatar={
                           <Avatar sx={{ bgcolor: `hsl(${index * 137.5}, 70%, 50%)` }}>
                             {review.authorName?.charAt(0) || 'A'} 
                           </Avatar>
                         }
                         title={review.title || `Review Suggestion ${index + 1}`}
                         subheader={review.authorName ? `${review.authorName}${review.location ? ` from ${review.location}` : ''}` : 'Generated Suggestion'}
                         action={
                           <Tooltip title={isSaved ? "Unsave Suggestion" : "Save Suggestion"}>
                             <IconButton onClick={() => handleToggleSaveReview(index)} color={isSaved ? "primary" : "default"}>
                               {isSaved ? <BookmarkIcon /> : <BookmarkBorderIcon />}
                             </IconButton>
                           </Tooltip>
                         }
                       />
                       <CardContent sx={{ pt: 0 }}>
                         <Rating value={review.rating || 5} readOnly precision={0.5} size="small" sx={{ mb: 1 }} />
                         <Typography variant="body2" color="text.secondary">
                           {review.content}
                         </Typography>
                         {review.date && (
                            <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                              Generated on {new Date(review.date).toLocaleDateString()}
                            </Typography>
                         )}
                       </CardContent>
                     </Card>
                    );
                  })}
                </Stack>
             )}
          </Box>
        );
        
      case 4:
        return (
          <Box sx={{ py: 2 }}>
            <Typography variant="h6" gutterBottom>
              Final Step: Send Your First Review Request (Optional)
            </Typography>
            <Typography variant="body2" color="text.secondary" paragraph>
                You can customize the email template below and send a request using one of the generated review suggestions.
                Alternatively, click "Finish" to go directly to your dashboard.
            </Typography>
            
            {/* Success message for sent email */}
            {successMessage && (
               <Alert severity="success" sx={{ mb: 3 }}>{successMessage}</Alert>
            )}

            {/* --- Toggle Email Editor Button --- */}
             <Button
               variant="outlined"
               onClick={() => setShowEmailTemplate(!showEmailTemplate)}
               startIcon={<MailOutlineIcon />}
               sx={{ mb: 3, borderRadius: 50, textTransform: 'none' }}
             >
               {showEmailTemplate ? 'Hide Email Template' : 'Customize Email Template'}
             </Button>

            {/* --- Email Editor UI (Conditional) --- */}
            {showEmailTemplate && (
               <Paper elevation={0} sx={{ p: 3, borderRadius: 3, bgcolor: '#f8f9fa', border: '1px solid', borderColor: 'divider', mb: 3 }}>
                 <Typography variant="h6" sx={{ mb: 3, fontWeight: 600 }}>Email Template</Typography>
                 <Grid container spacing={3}>
                   <Grid item xs={12} md={6}>
                     {/* From Name/Email (Consider making these editable later or pull from settings) */}
                     <TextField fullWidth label="From Name" name="fromName" value={emailTemplate.fromName} onChange={handleEmailTemplateChange} sx={{ mb: 2 }} />
                     <TextField fullWidth label="From Email" name="fromEmail" value={emailTemplate.fromEmail} onChange={handleEmailTemplateChange} sx={{ mb: 2 }} />
                     <TextField fullWidth label="Subject" name="subject" value={emailTemplate.subject} onChange={handleEmailTemplateChange} sx={{ mb: 2 }} />
                   </Grid>
                   <Grid item xs={12} md={6}>
                     {/* Incentive Section */}
                     <Box sx={{ mb: 3 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                         <Typography variant="subtitle2" color="text.secondary">Incentive Message</Typography>
                         <RegenerateButton onClick={() => handleRegenerateContent('incentive')} loading={regeneratingEmail.incentive} />
                       </Box>
                       <TextField fullWidth name="incentive" value={emailTemplate.incentive} onChange={handleEmailTemplateChange} placeholder="Offer an incentive..." sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
                     </Box>
                     {/* Content Section */}
                     <Box sx={{ mb: 2 }}>
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                         <Typography variant="subtitle2" color="text.secondary">Email Content</Typography>
                         <RegenerateButton onClick={() => handleRegenerateContent('content')} loading={regeneratingEmail.content} />
                       </Box>
                       {/* Variable Buttons */}
                       <Box sx={{ mb: 2 }}>
                         <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>Available Variables:</Typography>
                         <EmailVariableButton variable="customerName" icon={<PersonIcon />} label="Customer Name" onClick={() => insertVariable('customerName')} />
                         <EmailVariableButton variable="productName" icon={<ShoppingBagIcon />} label="Product Name" onClick={() => insertVariable('productName')} />
                         <EmailVariableButton variable="reviewContent" icon={<FormatQuoteIcon />} label="Review Content" onClick={() => insertVariable('reviewContent')} />
                         <EmailVariableButton variable="incentive" icon={<LocalOfferIcon />} label="Incentive" onClick={() => insertVariable('incentive')} />
                         {/* <EmailVariableButton variable="fromName" icon={<InsertEmoticonIcon />} label="From Name" onClick={() => insertVariable('fromName')} /> */}
                       </Box>
                       {/* Content Textarea */}
                       <TextField id="onboardingEmailContent" fullWidth multiline rows={8} name="content" value={emailTemplate.content} onChange={handleEmailTemplateChange} sx={{ '& .MuiOutlinedInput-root': { fontFamily: 'monospace', fontSize: '0.9rem' } }} />
                     </Box>
                   </Grid>
                 </Grid>
               </Paper>
             )}

            {/* Display saved reviews for sending */}
            <Typography variant="h6" gutterBottom sx={{mt: 3}}>Review Suggestions (Saved)</Typography>
             {generatedReviews.filter((_, index) => savedReviewIds.includes(index)).length > 0 ? (
                <Stack spacing={2} sx={{ mt: 2 }}>
                {generatedReviews.map((review, index) => { 
                    // Only render if saved
                    if (!savedReviewIds.includes(index)) return null; 
                    
                    return (
                        <Card key={index} variant="outlined">
                            <CardHeader
                                avatar={ <Avatar sx={{ bgcolor: `hsl(${index * 137.5}, 70%, 50%)` }}>{review.authorName?.charAt(0) || 'A'}</Avatar> }
                                title={review.title || `Review Suggestion ${index + 1}`}
                                subheader={review.authorName ? `${review.authorName}${review.location ? ` from ${review.location}` : ''}` : 'Generated Suggestion'}
                                action={ 
                                    <Button variant="contained" size="small" onClick={() => handleOpenEmailDialog(review)} startIcon={<SendIcon />} disabled={sendingStatus === 'sending'}>
                                        Send Request
                                    </Button>
                                }
                            />
                            <CardContent sx={{ pt: 0 }}>
                                <Rating value={review.rating || 5} readOnly precision={0.5} size="small" sx={{ mb: 1 }} />
                                <Typography variant="body2" color="text.secondary">{review.content}</Typography>
                                {review.date && <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>Generated on {new Date(review.date).toLocaleDateString()}</Typography>}
                            </CardContent>
                        </Card>
                    );
                })}
                </Stack>
             ) : (
                <Typography color="text.secondary" sx={{ mt: 2 }}>
                    You haven't saved any review suggestions yet. Go back to save some.
                </Typography>
             )}
          </Box>
        );

      default:
        return 'Unknown step';
    }
  };

  // --- RETURN JSX --- 
  return (
    <Container maxWidth="md">
      <Paper
        elevation={0}
        sx={{
          p: 4,
          mt: 4,
          border: '1px solid',
          borderColor: 'divider',
          borderRadius: 2,
        }}
      >
        <Stepper activeStep={activeStep} sx={{ mb: 4 }}>
          {steps.map((label) => (
            <Step key={label}>
              <StepLabel>{label}</StepLabel>
            </Step>
          ))}
        </Stepper>

        {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
                {error}
            </Alert>
        )}

        {loading ? (
            <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', minHeight: '200px' }}>
                <CircularProgress />
            </Box>
        ) : (
            getStepContent(activeStep)
        )}

        <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 4 }}>
          <Button color="inherit" onClick={handleSkip} sx={{ mr: 1 }} disabled={loading || isRegenerating || sendingStatus === 'sending'}>Skip Onboarding</Button>
          <Box>
            <Button disabled={activeStep === 0 || loading || isRegenerating || sendingStatus === 'sending'} onClick={handleBack} sx={{ mr: 1 }}>Back</Button>
            <Button variant="contained" onClick={handleNext} disabled={loading || isRegenerating || sendingStatus === 'sending'}>
              {loading && (activeStep === 0 || activeStep === 2 || activeStep === steps.length -1) ? <CircularProgress size={24} color="inherit" /> : (activeStep === steps.length - 1 ? 'Finish' : 'Next')}
            </Button>
          </Box>
        </Box>

        {/* --- Email Sending Dialog (must be outside conditional rendering of steps) --- */}
        <Dialog 
          open={emailDialogOpen} 
          onClose={handleCloseEmailDialog}
          maxWidth="md" fullWidth
          PaperProps={{ sx: { borderRadius: 3 } }}
        >
          <DialogTitle sx={{ pb: 1, borderBottom: '1px solid', borderColor: 'grey.100' }}>
            Send Review Request
          </DialogTitle>
          <DialogContent sx={{ pt: 3 }}>
            {/* Display Selected Review */}
            {currentReview && (
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Selected Review Suggestion</Typography>
                <Paper sx={{ p: 3, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                    <Rating value={currentReview.rating || 5} readOnly size="small" sx={{ mr: 1 }} />
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

            {/* Recipient Fields */}
            <Grid container spacing={3} sx={{ mb: 3 }}>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Recipient Name" name="toName" value={recipientData.toName} onChange={handleRecipientDataChange} required placeholder="Customer name" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
              <Grid item xs={12} md={6}>
                <TextField fullWidth label="Recipient Email" name="toEmail" value={recipientData.toEmail} onChange={handleRecipientDataChange} required placeholder="customer@example.com" type="email" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
              </Grid>
            </Grid>

            {/* Platform Selection */}
            <FormControl component="fieldset" fullWidth sx={{ mb: 2 }}>
              <FormLabel component="legend">Select Review Platforms to Include</FormLabel>
              <FormGroup>
                {Object.entries(platformData)
                  .filter(([_, info]) => info.profileUrl)
                  .map(([platform, info]) => (
                    <FormControlLabel
                      key={platform}
                      control={<Checkbox checked={selectedPlatforms[platform] || false} onChange={() => handlePlatformDialogChange(platform)} />}
                      label={
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                           {React.createElement(PLATFORM_ICONS[platform], { sx: { color: PLATFORM_COLORS[platform], fontSize: 18 } })}
                           <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{platform}</Typography>
                        </Box>
                      }
                    />
                  ))}
              </FormGroup>
              <FormHelperText>Only platforms with verified links are shown. Links will be included in the email.</FormHelperText>
            </FormControl>

            {/* Sending Status Indicators */}
            {sendingStatus === 'sending' && (
              <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mt: 2 }}>Sending...</Alert>
            )}
            {sendingStatus === 'success' && successMessage && (
              <Alert severity="success" icon={<CheckCircleIcon />} sx={{ mt: 2 }}>{successMessage}</Alert>
            )}
            {sendingStatus === 'error' && error && (
              <Alert severity="error" icon={<ErrorIcon />} sx={{ mt: 2 }}>{error}</Alert>
            )}
          </DialogContent>
          <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
            <Button onClick={handleCloseEmailDialog} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>Cancel</Button>
            <Button onClick={handleSendReviewRequest} variant="contained" disabled={sendingStatus === 'sending'} sx={{ borderRadius: 2, textTransform: 'none', px: 3 }}>
              {sendingStatus === 'sending' ? 'Sending...' : 'Send Request'}
            </Button>
          </DialogActions>
        </Dialog>
      </Paper>
    </Container>
  );
};

export default OnboardingFlow; 