import React, { useState, useEffect, useRef } from 'react';
import { Box, Typography, Container, Paper, Grid, Button, CircularProgress, Alert, Stack, Divider, Card, CardHeader, CardContent, Avatar, Rating, Chip, IconButton, Snackbar, Dialog, DialogTitle, DialogContent, DialogActions, Checkbox, FormGroup, FormControlLabel, FormControl, FormLabel, FormHelperText, TextField, Tooltip, Collapse, MenuItem, InputAdornment, ListItem, ListItemIcon, ListItemText } from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import AddCircleOutlineIcon from '@mui/icons-material/AddCircleOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import ReviewsIcon from '@mui/icons-material/Reviews';
import AutoModeIcon from '@mui/icons-material/AutoMode';
import EditNoteIcon from '@mui/icons-material/EditNote';
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutline';
import SendIcon from '@mui/icons-material/Send';
import TrustpilotIcon from '@mui/icons-material/Verified';
import CapterraIcon from '@mui/icons-material/AppRegistration';
import GoogleIcon from '@mui/icons-material/Google';
import G2Icon from '@mui/icons-material/Business';
import YelpIcon from '@mui/icons-material/Store';
import SaveIcon from '@mui/icons-material/Save';
import CancelIcon from '@mui/icons-material/Cancel';
import AutorenewIcon from '@mui/icons-material/Autorenew';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import StarIcon from '@mui/icons-material/Star';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import TitleIcon from '@mui/icons-material/Title';
import LinkIcon from '@mui/icons-material/Link';
import BrokenImageIcon from '@mui/icons-material/BrokenImage';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import LooksOneIcon from '@mui/icons-material/LooksOne';
import LooksTwoIcon from '@mui/icons-material/LooksTwo';
import Looks3Icon from '@mui/icons-material/Looks3';
import Badge from '@mui/material/Badge';
import MoreVertIcon from '@mui/icons-material/MoreVert';
import Menu from '@mui/material/Menu';
import CheckCircleOutlineIcon from '@mui/icons-material/CheckCircleOutline';

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

const PLATFORM_URL_TEMPLATES = {
  trustpilot: {
    prefix: 'www.trustpilot.com/review/',
    placeholder: 'your-company-page'
  },
  capterra: {
    prefix: 'www.capterra.com/p/',
    placeholder: 'product-id/product-name' // Example, might need verification
  },
  google: {
    prefix: 'search.google.com/local/writereview?placeid=', // Common pattern
    placeholder: 'YourGooglePlaceID'
  },
  g2: {
    prefix: 'www.g2.com/products/',
    placeholder: 'product-slug/reviews'
  },
  yelp: {
    prefix: 'www.yelp.com/biz/',
    placeholder: 'your-business-slug'
  }
};

const arrayToString = (arr) => (arr || []).join(', ');
const stringToArray = (str) => str ? str.split(/, ?\n?|,/).map(s => s.trim()).filter(Boolean) : [];

const EmailVariableButton = ({ variable, icon, label, onClick, disabled }) => (
  <Tooltip title={`Insert ${label} Variable`}>
    <span>
      <Button
        size="small"
        variant="outlined"
        onClick={() => onClick(variable)}
        startIcon={icon}
        disabled={disabled}
        sx={{
          mr: 1,
          mb: 1,
          borderRadius: 2,
          textTransform: 'none',
          fontSize: '0.75rem',
          py: 0.5,
          px: 1,
          borderColor: 'grey.300',
          '&:hover': {
            borderColor: 'primary.main',
            bgcolor: 'primary.50',
          }
        }}
      >
        {label}
      </Button>
    </span>
  </Tooltip>
);

const RegenerateButton = ({ onClick, loading, label = "Regenerate" }) => (
  <Tooltip title={label}>
    <span>
      <IconButton
        onClick={onClick}
        disabled={loading}
        size="small"
        sx={{
          color: 'primary.main',
          opacity: 0.7,
          '&:hover': {
            opacity: 1,
            bgcolor: 'primary.50',
          },
          '&.Mui-disabled': {
            color: 'grey.300',
            opacity: 0.5,
          }
        }}
      >
        {loading ? (
          <CircularProgress size={16} color="inherit" />
        ) : (
          <AutorenewIcon sx={{ fontSize: 18 }}/>
        )}
      </IconButton>
    </span>
  </Tooltip>
);

// --- Screenshot Machine API Key (Replace with your actual key!) ---
const SCREENSHOT_MACHINE_API_KEY = process.env.REACT_APP_SCREENSHOT_MACHINE_API_KEY;

// --- Status Colors (Example) ---
const STATUS_COLORS = {
  new: 'info',
  sent: 'secondary',
  received: 'success',
  pending: 'warning',
  completed: 'success',
  rejected: 'error',
  default: 'default'
};

const Dashboard = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [profileData, setProfileData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isUpdatingReviews, setIsUpdatingReviews] = useState(false);
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'info' });
  
  const [emailDialogOpen, setEmailDialogOpen] = useState(false);
  const [currentReview, setCurrentReview] = useState(null);
  const [sendingReviewIndex, setSendingReviewIndex] = useState(null);
  const [recipientData, setRecipientData] = useState({ toName: '', toEmail: '' });
  const [selectedPlatforms, setSelectedPlatforms] = useState({});
  const [sendingStatus, setSendingStatus] = useState(null);
  const [tempEmailSettings, setTempEmailSettings] = useState({ subject: '', content: '', fromName: '', incentive: '' });
  const [showEmailCustomization, setShowEmailCustomization] = useState(false);
  const [regeneratingEmailPart, setRegeneratingEmailPart] = useState({ 
    subject: false,
    content: false,
    incentive: false
  });
  const emailContentRef = useRef(null);
  const [isEditingDialogReview, setIsEditingDialogReview] = useState(false);
  const [dialogReviewContent, setDialogReviewContent] = useState('');

  const [isEditingOverview, setIsEditingOverview] = useState(false);
  const [tempAnalysisData, setTempAnalysisData] = useState(null);
  const [tempPlatformSuffixes, setTempPlatformSuffixes] = useState({});
  const [isSavingOverview, setIsSavingOverview] = useState(false);

  const [generationTone, setGenerationTone] = useState('Professional');
  const [generationCount, setGenerationCount] = useState(3);
  const [isGeneratingReviews, setIsGeneratingReviews] = useState(false);

  // --- Screenshot State (Using Screenshot Machine approach) ---
  const [screenshotLoading, setScreenshotLoading] = useState(false);
  const [screenshotError, setScreenshotError] = useState(null);

  // --- State for Status Update Menu ---
  const [statusMenuAnchorEl, setStatusMenuAnchorEl] = useState(null);
  const [statusMenuReviewIndex, setStatusMenuReviewIndex] = useState(null);
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) {
          setLoading(false);
          return;
      }

      setLoading(true);
      setError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') { throw dbError; }
        setProfileData(data || null); 

      } catch (err) {
        console.error('Error fetching profile:', err);
        setError('Failed to load dashboard data. Please try again.');
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();

  }, [user]); 

  // Reset screenshot state when website URL changes or profile loads
  useEffect(() => {
    if (profileData?.website) {
      console.log("[Dashboard] Website URL changed/loaded:", profileData.website, "Resetting screenshot state.");
      setScreenshotLoading(true); // Start loading when URL is available/changes
      setScreenshotError(null);
    } else {
      // No website, ensure loading is off and no error
      setScreenshotLoading(false);
      setScreenshotError(null);
    }
  }, [profileData?.website]); // Dependency on the website URL string

  const handleGenerateDashboardReviews = async () => {
    if (!profileData || isGeneratingReviews || isEditingOverview || !profileData?.analysis_data) {
       setSnackbar({ open: true, message: 'Cannot generate reviews. Ensure profile setup is complete and you are not currently editing.', severity: 'warning' });
       return;
    }

    setIsGeneratingReviews(true);
    setSnackbar({ open: true, message: 'Generating new review suggestions...', severity: 'info' });
    setError(null);

    // Construct the request body using Dashboard state
    // Match the structure expected by the backend (based on AIReviewGenerator)
    const requestBody = {
      tone: generationTone,
      reviewCount: generationCount, // Renamed from 'count'
      analysisResult: profileData.analysis_data, // Renamed from 'analysisData'
      additionalContext: profileData.additional_context || '', 
      productName: profileData.analysis_data?.productName,
      websiteUrl: profileData.website,
      // Add missing fields (provide defaults or empty values)
      customerName: '', 
      keyPoints: '', 
      reviewPlatforms: profileData.platform_urls || {}, // Use platform data from profile
      serviceType: '', 
    };

    console.log("Sending generation request with body:", requestBody);

    try {
      const response = await fetch('http://localhost:3001/api/generate-reviews', {
         method: 'POST',
         headers: { 'Content-Type': 'application/json' },
         body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
          let errorMsg = `API Error: ${response.status} ${response.statusText}`;
          try {
              const errorData = await response.json();
              errorMsg = errorData.message || JSON.stringify(errorData);
          } catch(e) { /* Ignore if response body isn't JSON */ }
          throw new Error(errorMsg);
      }

      const data = await response.json();
      console.log('API Response Data:', data);
      const rawNewReviews = data.reviews; // Assuming backend returns { reviews: [...] }
      
      if (!rawNewReviews || !Array.isArray(rawNewReviews)) {
         throw new Error("Invalid response format received from generation API.");
      }
      
      // --- Add createdAt timestamp in Frontend (Workaround) ---
      const now = new Date().toISOString();
      const newReviews = rawNewReviews.map(review => ({
          ...review,
          id: review.id || crypto.randomUUID(), // Ensure an ID exists (backend should ideally provide)
          status: review.status || 'new', // Ensure status exists
          createdAt: review.createdAt || now // Add timestamp if missing
      }));
      // --- End Workaround ---

      const combinedReviews = [ ...(profileData.generated_reviews || []), ...newReviews];
      
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ generated_reviews: combinedReviews })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      setProfileData(prev => ({ ...prev, generated_reviews: combinedReviews }));
      setSnackbar({ open: true, message: `${newReviews.length} new review suggestions generated!`, severity: 'success' });

    } catch (err) {
      console.error('Error generating reviews:', err);
      setError(`Failed to generate review suggestions: ${err.message || 'Please try again.'}`);
      setSnackbar({ open: true, message: `Error generating suggestions: ${err.message || 'Please try again.'}`, severity: 'error' });
    } finally {
      setIsGeneratingReviews(false);
    }
  };

  const handleRemoveReview = async (indexToRemove) => {
      if (!profileData || !profileData.generated_reviews) return;

      const originalReviews = profileData.generated_reviews;
      const updatedReviews = originalReviews.filter((_, index) => index !== indexToRemove);

      setProfileData(prev => ({ ...prev, generated_reviews: updatedReviews }));
      setIsUpdatingReviews(true);
      setSnackbar({ open: false, message: '' });

      try {
          const { error: updateError } = await supabase
              .from('business_profiles')
              .update({ generated_reviews: updatedReviews })
              .eq('user_id', user.id);

          if (updateError) throw updateError;

          setSnackbar({ open: true, message: 'Review suggestion removed.', severity: 'success' });

      } catch (err) {
          console.error('Error removing review:', err);
          setError('Failed to remove review suggestion.');
          setSnackbar({ open: true, message: 'Failed to remove suggestion.', severity: 'error' });
      } finally {
          setIsUpdatingReviews(false);
      }
  };

  const handleCloseSnackbar = (event, reason) => {
      if (reason === 'clickaway') {
        return;
      }
      setSnackbar({ ...snackbar, open: false });
    };

  const handleOpenEmailDialog = (review, index) => {
    if (!profileData?.platform_urls) return; 
    if (review.status === 'sent') {
        setSnackbar({ open: true, message: 'This review request has already been sent.', severity: 'info' });
        return;
    }
    setCurrentReview(review);
    setSendingReviewIndex(index);
    const initialSelected = Object.entries(profileData.platform_urls)
      .filter(([_, info]) => info.profileUrl)
      .reduce((acc, [platform]) => ({ ...acc, [platform]: true }), {});
    setSelectedPlatforms(initialSelected);
    setRecipientData({ toName: '', toEmail: '' });
    setTempEmailSettings({
      subject: profileData?.email_settings?.subject || 'Share Your Experience with {productName}',
      content: profileData?.email_settings?.content || 'Default content...',
      fromName: profileData?.email_settings?.fromName || 'Review Chaser',
      incentive: profileData?.email_settings?.incentive || ''
    });
    setDialogReviewContent(review.content || '');
    setIsEditingDialogReview(false);
    setRegeneratingEmailPart({ subject: false, content: false, incentive: false });
    setShowEmailCustomization(false);
    setSendingStatus(null);
    setError(null);
    setEmailDialogOpen(true);
  };

  const handleCloseEmailDialog = () => {
    setEmailDialogOpen(false);
    setCurrentReview(null);
    setRecipientData({ toName: '', toEmail: '' });
    setTempEmailSettings({ subject: '', content: '', fromName: '', incentive: '' });
    setRegeneratingEmailPart({ subject: false, content: false, incentive: false });
    setShowEmailCustomization(false);
    setDialogReviewContent('');
    setIsEditingDialogReview(false);
    setSendingStatus(null);
    setSendingReviewIndex(null);
  };

  const handleRecipientDataChange = (e) => {
    const { name, value } = e.target;
    setRecipientData(prev => ({ ...prev, [name]: value }));
  };

  const handlePlatformDialogChange = (platform) => {
    setSelectedPlatforms(prev => ({ ...prev, [platform]: !prev[platform] }));
  };

  const handleTempEmailSettingsChange = (e) => {
    const { name, value } = e.target;
    setTempEmailSettings(prev => ({ ...prev, [name]: value }));
  };

  const handleSendReviewRequest = async () => {
    if (!currentReview || sendingReviewIndex === null || !recipientData.toEmail || !recipientData.toName || !profileData) {
       setSnackbar({ open: true, message: 'Missing data to send request.', severity: 'error' });
       setSendingStatus('error');
       return;
    }

    setSendingStatus('sending');
    setSnackbar({ open: false, message: '' });
    setError(null);

    const originalReviews = profileData.generated_reviews || [];

    try {
      const platformsToSend = Object.entries(selectedPlatforms)
        .filter(([platform, selected]) => selected && profileData.platform_urls?.[platform]?.profileUrl)
        .map(([platform]) => ({ 
            id: platform, 
            profileUrl: profileData.platform_urls[platform].profileUrl 
        }));

      const reviewRequest = {
        reviewContent: dialogReviewContent,
        productName: profileData.analysis_data?.productName || profileData.business_name || 'your product',
        rating: currentReview.rating,
        title: currentReview.title || `Review for ${profileData.analysis_data?.productName || profileData.business_name}`,
      };

      const emailData = {
        toName: recipientData.toName,
        toEmail: recipientData.toEmail,
        fromName: tempEmailSettings.fromName || 'Review Chaser',
        fromEmail: profileData?.email_settings?.fromEmail || 'default@example.com',
        subject: tempEmailSettings.subject || 'Share Your Experience with {productName}',
        content: tempEmailSettings.content || 'Default content...',
        incentive: tempEmailSettings.incentive || '',
        platforms: platformsToSend,
      };
      
      console.log("Sending Payload:", { reviewRequest, emailData });

      const response = await fetch('http://localhost:3001/api/send-review-request', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reviewRequest, emailData }),
      });

      if (!response.ok) {
         const errorData = await response.json();
         throw new Error(errorData.message || 'Failed to send review request');
      }
      
      const now = new Date().toISOString();
      const updatedReviews = originalReviews.map((review, index) => {
          if (index === sendingReviewIndex) {
              return {
                  ...review,
                  status: 'sent',
                  sentAt: now,
              };
          }
          return review;
      });

      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ generated_reviews: updatedReviews })
        .eq('user_id', user.id);

      if (updateError) {
         console.error("Error updating review status in Supabase:", updateError);
         setSnackbar({ open: true, message: `Request sent, but failed to update status: ${updateError.message}`, severity: 'warning' });
      } else {
          setSnackbar({ open: true, message: `Review request sent successfully to ${recipientData.toEmail}`, severity: 'success' });
      }

      setProfileData(prev => ({ ...prev, generated_reviews: updatedReviews }));
      setSendingStatus('success');
      
      setTimeout(() => handleCloseEmailDialog(), 2500);

    } catch (err) {
      console.error('Error sending review request or updating status:', err);
      setSendingStatus('error');
      const displayError = error?.message || 'An error occurred.';
      setSnackbar({ open: true, message: `Error: ${displayError}`, severity: 'error' });
    }
  };

  const handleEditOverview = () => {
    if (isGeneratingReviews) return; 
    setTempAnalysisData(JSON.parse(JSON.stringify(profileData?.analysis_data || {}))); 
    
    // Initialize suffixes from full URLs
    const initialSuffixes = {};
    const currentPlatformUrls = profileData?.platform_urls || {};
    Object.keys(PLATFORM_URL_TEMPLATES).forEach(platform => {
        const template = PLATFORM_URL_TEMPLATES[platform];
        const fullUrl = currentPlatformUrls[platform]?.profileUrl || '';
        let suffix = '';
        // Check if fullUrl starts with http(s):// followed by prefix, or just prefix
        const httpsPrefix = `https://${template.prefix}`;
        const httpPrefix = `http://${template.prefix}`;
        const directPrefix = template.prefix;

        if (fullUrl.startsWith(httpsPrefix)) {
            suffix = fullUrl.substring(httpsPrefix.length);
        } else if (fullUrl.startsWith(httpPrefix)) {
            suffix = fullUrl.substring(httpPrefix.length);
        } else if (fullUrl.startsWith(directPrefix)) {
            // Handle cases where user might have entered www. part without http
             suffix = fullUrl.substring(directPrefix.length);
        } else if (fullUrl && !fullUrl.startsWith('http') && !fullUrl.includes('://')){
            // Basic check: If it doesn't look like a URL but isn't empty, assume it MIGHT be a suffix?
            // This is less reliable, might need adjustment based on expected input.
            // Or potentially ignore if prefix doesn't match at all?
            // For now, let's assume if no prefix matches, but it exists, it *is* the suffix.
            // This could be wrong if they entered a completely different URL.
            // Consider clearing if prefix doesn't match? 
            // suffix = fullUrl; // Tentative: Use the whole value if no prefix matches
             suffix = ''; // Safer: Clear if prefix doesn't match
        }
        initialSuffixes[platform] = suffix;
    });
    setTempPlatformSuffixes(initialSuffixes);
    
    setIsEditingOverview(true);
  };

  const handleCancelOverview = () => {
    setIsEditingOverview(false);
    setTempAnalysisData(null);
    setTempPlatformSuffixes({}); // Reset suffixes
  };

  const handleAnalysisDataChange = (e) => {
    const { name, value } = e.target;
    if (name === 'features' || name === 'uniqueSellingPoints') {
      setTempAnalysisData(prev => ({ ...prev, [name]: stringToArray(value) }));
    } else {
      setTempAnalysisData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handlePlatformSuffixChange = (platform, suffix) => {
      setTempPlatformSuffixes(prev => ({
          ...prev,
          [platform]: suffix
      }));
  };

  const handleSaveOverview = async () => {
    if ((!tempAnalysisData && Object.keys(tempPlatformSuffixes).length === 0) || !user) return;

    setIsSavingOverview(true);
    setSnackbar({ open: false, message: '' });
    setError(null);

    const updatePayload = {};
    if (tempAnalysisData) {
      updatePayload.analysis_data = {
           ...tempAnalysisData,
           features: Array.isArray(tempAnalysisData.features) ? tempAnalysisData.features : stringToArray(tempAnalysisData.features),
           uniqueSellingPoints: Array.isArray(tempAnalysisData.uniqueSellingPoints) ? tempAnalysisData.uniqueSellingPoints : stringToArray(tempAnalysisData.uniqueSellingPoints),
      };
    }
    
    // Reconstruct platform_urls from suffixes
    const finalPlatformUrls = {};
    Object.keys(tempPlatformSuffixes).forEach(platform => {
        const suffix = tempPlatformSuffixes[platform]?.trim();
        if (suffix) { // Only save if suffix is not empty
            const template = PLATFORM_URL_TEMPLATES[platform];
            // Always save with https:// for consistency, unless prefix already includes it (less common)
            const prefix = template.prefix.startsWith('http') ? template.prefix : `https://${template.prefix}`;
            finalPlatformUrls[platform] = { profileUrl: prefix + suffix };
        } else {
             // If suffix is empty, ensure we save null or an empty object field if needed by backend/Supabase
             finalPlatformUrls[platform] = { profileUrl: null }; // Or potentially remove the key
        }
    });
    updatePayload.platform_urls = finalPlatformUrls;

    if (Object.keys(updatePayload.analysis_data || {}).length === 0 && Object.keys(updatePayload.platform_urls || {}).length === 0) {
      console.log("Nothing changed to save.");
      setIsSavingOverview(false);
      handleCancelOverview(); // Exit edit mode if nothing changed
      return; 
    }

    try {
      console.log("Saving Overview with payload:", updatePayload);
      const { data, error: updateError } = await supabase
        .from('business_profiles')
        .update(updatePayload) 
        .eq('user_id', user.id)
        .select() 
        .single();

      if (updateError) throw updateError;

      setProfileData(prev => ({ 
          ...prev,
          analysis_data: data.analysis_data, 
          platform_urls: data.platform_urls 
      }));
      setSnackbar({ open: true, message: 'Overview details updated successfully.', severity: 'success' });
      setIsEditingOverview(false);
      setTempAnalysisData(null);
      setTempPlatformSuffixes({});

    } catch (err) {
      console.error('Error saving overview:', err);
      setError('Failed to save overview details.');
      setSnackbar({ open: true, message: `Error saving: ${err.message || 'Please try again.'}`, severity: 'error' });
    } finally {
      setIsSavingOverview(false);
    }
  };

  const handleDialogReviewContentChange = (e) => {
      setDialogReviewContent(e.target.value);
  };

  const handleEditDialogReviewClick = () => {
      setIsEditingDialogReview(true);
  };

  const handleCancelDialogReviewEdit = () => {
      setDialogReviewContent(currentReview?.content || '');
      setIsEditingDialogReview(false);
  };

  const handleSaveDialogReviewEdit = () => {
      setIsEditingDialogReview(false); 
      setSnackbar({ open: true, message: 'Review content updated for this email.', severity: 'info' });
  };

  const handleToggleEmailCustomization = () => {
    setShowEmailCustomization(prev => !prev);
  };

  const handleRegenerateEmailPart = async (part) => {
    console.log(`Regenerating email ${part}...`);
    setRegeneratingEmailPart(prev => ({ ...prev, [part]: true }));
    setSnackbar({ open: false, message: '' });
    setError(null);
    
    try {
      // --- Actual API Call (adapted from OnboardingFlow) --- 
      const productName = profileData?.analysis_data?.productName || profileData?.business_name || 'your product';
      // Determine context - might need refinement based on backend needs
      const context = (
          (profileData?.analysis_data ? JSON.stringify(profileData.analysis_data) : '') + 
          ' ' + 
          (profileData?.additional_context || '')
      ).trim();

      const requestBody = {
        type: part, // 'subject', 'content', or 'incentive'
        productName: productName,
        context: context,
        // Add other relevant data if your backend expects it
        reviewContent: currentReview?.content,
        reviewRating: currentReview?.rating,
      };

      console.log("Sending regeneration request:", requestBody);

      const response = await fetch('/api/generate-email-content', { // Assuming this endpoint
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(requestBody),
      });

      if (!response.ok) {
        let errorMsg = `API Error: ${response.status}`;
        try {
           const errorData = await response.json();
           errorMsg = errorData.message || errorMsg;
        } catch(e) { /* Ignore */ }
        throw new Error(errorMsg);
      }

      const data = await response.json();
      
      if (!data.content) {
        throw new Error('Invalid response from generation API (missing content)');
      }

      // Update the specific part in tempEmailSettings
      setTempEmailSettings(prev => ({
           ...prev, 
           [part]: data.content 
      }));
      setSnackbar({ open: true, message: `Email ${part} regenerated successfully.`, severity: 'success' });

    } catch (err) {
       console.error(`Error regenerating email ${part}:`, err);
       setError(`Failed to regenerate ${part}: ${err.message || 'Please try again.'}`);
       setSnackbar({ open: true, message: `Error regenerating ${part}: ${err.message || 'Please try again.'}`, severity: 'error' });
    } finally {
       setRegeneratingEmailPart(prev => ({ ...prev, [part]: false }));
    } 
  };

  const handleInsertVariable = (variable) => {
    console.log(`Inserting variable: ${variable}`);
    const contentInput = emailContentRef.current;
    if (contentInput) {
       const start = contentInput.selectionStart;
       const end = contentInput.selectionEnd;
       const currentContent = tempEmailSettings.content;
       const newContent = currentContent.substring(0, start) + variable + currentContent.substring(end);
      
       setTempEmailSettings(prev => ({ ...prev, content: newContent }));

       requestAnimationFrame(() => {
          contentInput.selectionStart = contentInput.selectionEnd = start + variable.length;
          contentInput.focus(); 
       });
    } else {
       setSnackbar({ open: true, message: 'Could not insert variable.', severity: 'warning' });
    }
  };

  // --- Status Menu Handlers ---
  const handleOpenStatusMenu = (event, index) => {
    setStatusMenuAnchorEl(event.currentTarget);
    setStatusMenuReviewIndex(index);
  };

  const handleCloseStatusMenu = () => {
    setStatusMenuAnchorEl(null);
    setStatusMenuReviewIndex(null);
  };

  // --- Status Update Handler ---
  const handleUpdateReviewStatus = async (index, newStatus) => {
    handleCloseStatusMenu(); // Close menu first
    if (index === null || !newStatus || isUpdatingStatus) return;

    const originalReviews = profileData?.generated_reviews || [];
    if (index < 0 || index >= originalReviews.length) return; // Invalid index

    setIsUpdatingStatus(true);
    setSnackbar({ open: false, message: '' });
    setError(null);

    const now = new Date().toISOString();
    const updatedReviews = originalReviews.map((review, i) => {
      if (i === index) {
        return { 
            ...review, 
            status: newStatus, 
            updatedAt: now 
        };
      }
      return review;
    });

    try {
      // Update Supabase
      const { error: updateError } = await supabase
        .from('business_profiles')
        .update({ generated_reviews: updatedReviews })
        .eq('user_id', user.id);

      if (updateError) throw updateError;

      // Update local state
      setProfileData(prev => ({ ...prev, generated_reviews: updatedReviews }));
      setSnackbar({ open: true, message: `Review status updated to '${newStatus}'.`, severity: 'success' });

    } catch (err) {
      console.error('Error updating review status:', err);
      setError(`Failed to update status: ${err.message || 'Please try again.'}`);
      setSnackbar({ open: true, message: `Error updating status: ${err.message || 'Please try again.'}`, severity: 'error' });
       // Optionally revert local state here if needed
       // setProfileData(prev => ({ ...prev, generated_reviews: originalReviews }));
    } finally {
       setIsUpdatingStatus(false);
    }
  };

  if (loading && !profileData) {
    return (
      <Container maxWidth="lg">
        <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '80vh' }}>
          <CircularProgress />
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Typography variant="h4" component="h1" gutterBottom sx={{ mb: 4 }}>
        {profileData?.business_name ? `Welcome, ${profileData.business_name}!` : 'Dashboard'}
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>
      )}

      {!profileData && !loading && (
          <Alert severity="info" sx={{ mb: 3 }}>
            It looks like you haven't completed the initial setup. 
            <Button size="small" variant="text" onClick={() => navigate('/onboarding')} sx={{ ml: 1 }}>Go to Setup</Button>
          </Alert>
      )}

      {profileData && (
      <Grid container spacing={3}>
          
            {/* --- Automation Card (Moved to Top) --- */}
            <Grid item xs={12}>
               <Paper sx={{ p: 3, borderRadius: 2, height: '100%', backgroundColor: 'grey.50', border: '1px dashed', borderColor: 'grey.300' }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                   <AutoModeIcon sx={{ mr: 1, color: 'grey.500' }} />
                   <Typography variant="h6" color="grey.700">Automation (Coming Soon)</Typography>
                 </Box>
                 <Typography variant="body2" color="text.secondary">
                    Features like automatically sending review requests based on triggers or schedules are planned for the future!
            </Typography>
          </Paper>
        </Grid>

            {/* --- Combined Preview & Overview Card --- */} 
            <Grid item xs={12}>
              {/* Main Paper for the combined card */}
              <Paper sx={{ p: { xs: 2, sm: 3 }, borderRadius: 2, position: 'relative' }}> 
                 {/* Top-right buttons for Edit/Save/Cancel */} 
                 <Box sx={{ position: 'absolute', top: { xs: 16, sm: 24 }, right: { xs: 16, sm: 24 } }}>
                     {!isEditingOverview ? (
                         <Button 
                            size="small" 
                            startIcon={<EditNoteIcon />} 
                            onClick={handleEditOverview} 
                            disabled={!profileData || isSavingOverview || isGeneratingReviews}
                            sx={{ textTransform: 'none' }}
                         >
                            Edit Details
                         </Button>
                     ) : (
                        <Stack direction="row" spacing={1}>
                           <Button size="small" onClick={handleCancelOverview} disabled={isSavingOverview} sx={{ textTransform: 'none' }}>Cancel</Button>
                           <Button size="small" variant="contained" onClick={handleSaveOverview} disabled={isSavingOverview} sx={{ textTransform: 'none' }}>
                             {isSavingOverview ? <CircularProgress size={16} color="inherit"/> : 'Save'}
                           </Button>
                        </Stack>
                     )}
                 </Box>

                 {/* Nested Grid for the two columns */}
                 <Grid container spacing={{ xs: 2, md: 4 }}> 
                     {/* Website Preview Column */}
                     {/* Adjusted width and added centering for image container */}
                     <Grid item xs={12} md={5} sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}> 
                         <Box sx={{ mt: 2, width: '100%', maxWidth: 400 }}> {/* Added maxWidth for centering control */}
                             {profileData.website ? (
                                 <Typography 
                                    variant="body2" 
                                    component="a" 
                                    href={profileData.website.startsWith('http') ? profileData.website : `//${profileData.website}`}
                                    target="_blank" 
                                    rel="noopener noreferrer"
                                    sx={{ display: 'flex', alignItems: 'center', textDecoration: 'none', color: 'primary.main', mb: 2, '&:hover': { textDecoration: 'underline' } }}
                                 >
                                    <LinkIcon sx={{ mr: 0.5, fontSize: '1rem' }} /> {profileData.website}
                                 </Typography>
                             ) : (
                                 <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                                    No website URL configured. Add it in Settings or Setup.
                                 </Typography>
                             )}
        
                             {profileData.website && (
          <Paper
                                   variant="outlined" 
                                   sx={{ 
                                       height: 280, 
                                       display: 'flex', 
                                       justifyContent: 'center', 
                                       alignItems: 'center', 
                                       bgcolor: 'grey.100',
                                       position: 'relative',
                                       overflow: 'hidden',
                                       borderRadius: 1,
                                       width: '100%' // Ensure paper takes width for centering
                                   }}
                               >
                                   {/* Loading Indicator Overlay */}
                                   {screenshotLoading && (
                                     <Box
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
                                 bgcolor: 'rgba(255, 255, 255, 0.8)', // Semi-transparent overlay
                                 zIndex: 1, // Above image while loading
                               }}
                             >
                               <CircularProgress size={40} sx={{ mb: 2 }} />
                               <Typography variant="body2" color="text.secondary">
                                 Generating preview...
            </Typography>
                             </Box>
                           )}
                           
                           {/* Error/Placeholder Display */} 
                           {!screenshotLoading && screenshotError && (
                              <Box sx={{ textAlign: 'center', p: 2 }}>
                                 <BrokenImageIcon sx={{ fontSize: 48, color: 'grey.400', mb: 1 }} />
                                 <Typography variant="caption" color="text.secondary">
                                    {screenshotError}
            </Typography>
                              </Box>
                           )}
                           
                           {/* Screenshot Image */} 
                           <img
                              // Key forces re-render if URL changes, helps trigger loading state reset
                              key={profileData.website} 
                              src={`https://api.screenshotmachine.com/?key=${SCREENSHOT_MACHINE_API_KEY}&url=${encodeURIComponent(profileData.website)}&dimension=1024x768&device=desktop&format=png&cacheLimit=0&delay=2000&zoom=100`}
                              alt={`Website Preview for ${profileData.website}`}
                              style={{
                                width: '100px',
                                objectFit: 'cover',
                                position: 'relative',
                                zIndex: 0, // Below loading overlay
                                // Opacity controlled by loading state overlay presence
                                opacity: screenshotLoading ? 0 : 1, 
                                transition: 'opacity 0.5s ease-in-out' // Fade-in effect
                              }}
                              // Use handlers to update React state
                              onLoad={() => {
                                console.log("[Dashboard] Screenshot loaded.");
                                setScreenshotLoading(false);
                                setScreenshotError(null);
                              }}
                              onError={(e) => {
                                console.error("[Dashboard] Screenshot error event:", e);
                                setScreenshotLoading(false);
                                setScreenshotError('Unable to load preview.');
                                // Optional: Hide broken image icon if you prefer
                                // e.target.style.display = 'none'; 
                              }}
                            />
          </Paper>
                     )}
                  </Box>
        </Grid>

                     {/* Overview Details Column */}
                     {/* Adjusted width */} 
                     <Grid item xs={12} md={7}>
                       {/* Removed Overview Title Typography */}
                       {/* Removed outer Paper wrappers */} 
                      {(profileData?.analysis_data || profileData?.platform_urls || isEditingOverview) ? (
                          <Stack spacing={3}> {/* Increased spacing slightly */} 
                              {/* --- Basic Information --- */}
                              <Box> 
                                 <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>Basic Information</Typography>
                                 {isEditingOverview ? (
                                    <Stack spacing={2} sx={{ mt: 1 }}>
                                        <TextField fullWidth label="Product/Company" name="productName" value={tempAnalysisData?.productName || ''} onChange={handleAnalysisDataChange} disabled={isSavingOverview} variant="outlined" size="small" />
                                        <TextField fullWidth label="Industry" name="industry" value={tempAnalysisData?.industry || ''} onChange={handleAnalysisDataChange} disabled={isSavingOverview} variant="outlined" size="small" />
                                        <TextField fullWidth multiline rows={3} label="Target Audience" name="targetAudience" value={tempAnalysisData?.targetAudience || ''} onChange={handleAnalysisDataChange} disabled={isSavingOverview} variant="outlined" size="small" />
                                    </Stack>
                                  ) : (
                                     <Stack spacing={1} sx={{ mt: 1 }}>
                                        <Box>
                                             <Typography variant="caption" display="block" color="text.secondary">Product/Company</Typography>
                                             <Typography sx={{ fontWeight: 500 }}>{profileData?.analysis_data?.productName || 'N/A'}</Typography>
                                         </Box>
                                         <Box>
                                             <Typography variant="caption" display="block" color="text.secondary">Industry</Typography>
                                             <Typography>{profileData?.analysis_data?.industry || 'N/A'}</Typography>
                                         </Box>
                                         <Box>
                                             <Typography variant="caption" display="block" color="text.secondary">Target Audience</Typography>
                                             <Typography>{profileData?.analysis_data?.targetAudience || 'N/A'}</Typography>
                                          </Box>
                                      </Stack>
                                   )}
                              </Box>
    
                               {/* --- Key Features --- */}
                              <Box> 
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>Key Features</Typography>
                                {isEditingOverview ? (
                                    <TextField fullWidth multiline rows={4} name="features" value={arrayToString(tempAnalysisData?.features)} onChange={handleAnalysisDataChange} placeholder="Enter features, separated by commas or new lines" disabled={isSavingOverview} variant="outlined" size="small" helperText="Separate each feature with a comma or new line."/>
                                ) : (
                                  (profileData?.analysis_data?.features && profileData.analysis_data.features.length > 0) ? (
                                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt: 0.5}}>
                                          {profileData.analysis_data.features.map((feature, index) => (
                                              <Chip key={index} label={feature} size="small" variant="outlined" />
                                          ))}
                                      </Stack>
                                  ) : (<Typography variant="caption" color="text.secondary">N/A</Typography>)
                                )}
                              </Box>
    
                               {/* --- Unique Selling Points --- */}
                              <Box> 
                                <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>Unique Selling Points</Typography>
                                {isEditingOverview ? (
                                    <TextField fullWidth multiline rows={4} name="uniqueSellingPoints" value={arrayToString(tempAnalysisData?.uniqueSellingPoints)} onChange={handleAnalysisDataChange} placeholder="Enter USPs, separated by commas or new lines" disabled={isSavingOverview} variant="outlined" size="small" helperText="Separate each USP with a comma or new line."/>
                                ) : (
                                  (profileData?.analysis_data?.uniqueSellingPoints && profileData.analysis_data.uniqueSellingPoints.length > 0) ? (
                                      <Stack direction="row" spacing={1} useFlexGap flexWrap="wrap" sx={{mt: 0.5}}>
                                          {profileData.analysis_data.uniqueSellingPoints.map((point, index) => (
                                              <Chip key={index} label={point} size="small" variant="outlined" />
                                          ))}
                                      </Stack>
                                  ) : (<Typography variant="caption" color="text.secondary">N/A</Typography>)
                                )}
                              </Box>
                              
                              {/* --- Platform URLs --- */}
                              <Box> 
                                 <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 600, color: 'text.secondary' }}>{isEditingOverview ? 'Platform URLs' : 'Detected Platforms'}</Typography>
                                 {isEditingOverview ? (
                                    <Stack spacing={1.5} sx={{ mt: 1 }}>
                                    {Object.keys(PLATFORM_URL_TEMPLATES).map((platform) => {
                                        const PlatformIcon = PLATFORM_ICONS[platform];
                                        const template = PLATFORM_URL_TEMPLATES[platform];
                                        // Display prefix correctly, handling potential http(s) already in it
                                        const displayPrefix = template.prefix.startsWith('http') ? template.prefix : `https://${template.prefix}`;

                                        return (
                                          <TextField
                                            key={platform}
                                            fullWidth
                                            // Label is now less useful as prefix is visible
                                            // label={platform.charAt(0).toUpperCase() + platform.slice(1)}
                                            size="small"
                                            variant="outlined"
                                            value={tempPlatformSuffixes[platform] || ''} // Bind to suffix state
                                            onChange={(e) => handlePlatformSuffixChange(platform, e.target.value)} // Use suffix handler
                                            placeholder={template.placeholder} // Use placeholder from template
                                            disabled={isSavingOverview}
                                            InputProps={{
                                              startAdornment: (
                                                <InputAdornment position="start" sx={{ mr: 0.5, color: 'text.secondary' }}>
                                                  <PlatformIcon sx={{ color: PLATFORM_COLORS[platform] || 'action.active', fontSize: 18, mr: 0.5 }} />
                                                  {/* Display prefix without https:// for cleaner look */}
                                                  <Typography variant="caption" noWrap sx={{ color: 'text.secondary' }}>
                                                    {template.prefix}
                                                  </Typography>
                                                </InputAdornment>
                                              ),
                                            }}
                                            sx={{ 
                                                '& .MuiOutlinedInput-root': { borderRadius: 1.5 },
                                                '& .MuiInputAdornment-root': { mr: 0 } // Adjust spacing
                                               }}
                                          />
                                        );
                                      })}
                                    </Stack>
                                  ) : (
                                     <Stack direction="row" spacing={1.5} useFlexGap flexWrap="wrap" sx={{ mt: 1 }}>
                                        {Object.entries(profileData?.platform_urls || {}).filter(([_, info]) => info.profileUrl).length > 0 ? (
                                          Object.entries(profileData.platform_urls)
                                             .filter(([_, info]) => info.profileUrl)
                                             .map(([platform, info]) => {
                                                const PlatformIcon = PLATFORM_ICONS[platform];
                                                if (!PlatformIcon) return null;
                                                return (
                                                   <Tooltip key={platform} title={platform.charAt(0).toUpperCase() + platform.slice(1)}>
                                                      <Avatar 
            sx={{
                                                        bgcolor: PLATFORM_COLORS[platform] || 'grey.300', 
                                                        width: 32, 
                                                        height: 32 
                                                     }}
                                                     variant="rounded"
                                                  >
                                                     <PlatformIcon sx={{ color: '#fff', fontSize: 18 }} />
                                                  </Avatar>
                                               </Tooltip>
                                             );
                                          })
                                       ) : (
                                         <Typography variant="caption" color="text.secondary">No platforms configured with URLs.</Typography>
                                       )}
                                    </Stack>
                                    )}
                              </Box>
                          </Stack>
                      ) : (
                           <Typography variant="body2" color="text.secondary">Analysis data or platform data not available.</Typography>
                      )}
                     </Grid>
                 </Grid> 
          </Paper>
        </Grid>

             {/* --- Saved Review Suggestions (Now includes generation controls) --- */} 
            <Grid item xs={12}>
               <Paper sx={{ p: 3, borderRadius: 2 }}>
                  <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 2 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center' }}>
                       <ReviewsIcon sx={{ mr: 1, color: 'primary.main' }} />
                       <Typography variant="h6">Review Requests</Typography>
                    </Box>
                    {/* Optional: Add count badge here? */}
                  </Box>
                  
                  {/* --- Generation Controls (Moved Here) --- */}
                  <Box sx={{ mb: 3, pt: 1, borderTop: '1px solid', borderColor: 'divider' }}> 
                     <Typography variant="subtitle2" sx={{ mb: 1.5, fontWeight: 600 }}>Generate More</Typography>
                     <Stack spacing={2} direction={{ xs: 'column', sm: 'row' }} sx={{ alignItems: 'flex-start' }}>
                         <TextField
                             select
                             label="Tone"
                             value={generationTone}
                             onChange={(e) => setGenerationTone(e.target.value)}
                             size="small"
                             disabled={isGeneratingReviews || isEditingOverview}
                             sx={{ minWidth: 150 }}
                             SelectProps={{ MenuProps: { disableScrollLock: true } }} 
                         >
                            <MenuItem value="Professional">Professional</MenuItem>
                            <MenuItem value="Casual">Casual</MenuItem>
                            <MenuItem value="Friendly">Friendly</MenuItem>
                            <MenuItem value="Enthusiastic">Enthusiastic</MenuItem>
                            <MenuItem value="Appreciative">Appreciative</MenuItem>
                            <MenuItem value="Concise">Concise</MenuItem>
                            <MenuItem value="Critical">Critical</MenuItem>
                            <MenuItem value="Detailed">Detailed</MenuItem>
                            <MenuItem value="Humorous">Humorous</MenuItem>
                            <MenuItem value="Formal">Formal</MenuItem>
                            <MenuItem value="Informal">Informal</MenuItem>
                         </TextField>
                         <TextField
                             label="Number"
                             type="number"
                             value={generationCount}
                             onChange={(e) => setGenerationCount(Math.max(1, parseInt(e.target.value, 10) || 1))} 
                             size="small"
                             disabled={isGeneratingReviews || isEditingOverview}
                             InputProps={{ inputProps: { min: 1, max: 10 } }} 
                             sx={{ maxWidth: 100 }}
                         />
                         <Button
                             variant="contained"
                             startIcon={isGeneratingReviews ? <CircularProgress size={20} color="inherit" /> : <AddCircleOutlineIcon />}
                             onClick={handleGenerateDashboardReviews}
                             disabled={isGeneratingReviews || isEditingOverview || !profileData?.analysis_data} 
                             sx={{ height: '40px' }} // Match TextField small height
                         >
                             Generate
                         </Button>
                     </Stack>
                     {!profileData?.analysis_data && (
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mt: 1}}>
                           Analysis data needed for generation. Complete setup if missing.
                        </Typography>
                     )}
                   </Box>
                   
                   {/* --- Existing Review List --- */}
                   {(profileData?.generated_reviews && profileData.generated_reviews.length > 0) ? (
                       <Stack spacing={2} sx={{ mt: 2 }}>
                          {profileData.generated_reviews.map((review, index) => {
                           const status = review.status || 'new';
                           const color = STATUS_COLORS[status] || STATUS_COLORS.default;
                           const createdAt = review.createdAt ? new Date(review.createdAt).toLocaleDateString() : 'Unknown';
                           const sentAt = review.sentAt ? new Date(review.sentAt).toLocaleDateString() : null;
                           const isSentOrCompleted = status === 'sent' || status === 'completed' || status === 'received'; // Add 'received' here too
                           
                           return (
                             <Card key={review.id || index} variant="outlined" sx={{ position: 'relative' }}>
                                <CardHeader
                                  avatar={ <Avatar sx={{ bgcolor: `hsl(${index * 137.5}, 70%, 50%)` }}>{review.authorName?.charAt(0) || 'S'}</Avatar> }
                                  title={review.title || `Suggestion ${index + 1}`}
                                  subheader={
                                      <Box sx={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: 1, mt: 0.5 }}>
                                         <Typography variant="caption">
                                            {review.authorName ? `${review.authorName}${review.location ? ` from ${review.location}` : ''}` : 'Generated Suggestion'}
                                         </Typography>
                                         <Chip label={status} color={color} size="small" sx={{ textTransform: 'capitalize', height: '18px', fontSize: '0.7rem' }} />
                                      </Box>
                                  }
                                  action={
                                    <Stack direction="row" spacing={0.5} sx={{ position: 'absolute', top: 8, right: 8 }}>
                                       {/* Status Update Menu Button */}
                                       <Tooltip title="Update Status">
                                          <span>
                                             <IconButton
                                                aria-label="update review status"
                                                aria-controls={`status-menu-${index}`}
                                                aria-haspopup="true"
                                                onClick={(e) => handleOpenStatusMenu(e, index)}
                                                size="small"
                                                disabled={isUpdatingStatus || isUpdatingReviews || isGeneratingReviews || sendingStatus === 'sending' || isEditingOverview}
                                             >
                                                <MoreVertIcon fontSize="small" />
                                             </IconButton>
                                          </span>
                                       </Tooltip>
                                      {/* Send Button */}
                                      <Tooltip title={isSentOrCompleted ? "Request Requested/Received" : "Send Request"}>
                                        <span> 
                                          <IconButton 
                                            aria-label="Send review request"
                                            onClick={() => handleOpenEmailDialog(review, index)}
                                            size="small"
                                            color={isSentOrCompleted ? "inherit" : "primary"}
                                            disabled={isSentOrCompleted || isUpdatingReviews || sendingStatus === 'sending' || isEditingOverview || isUpdatingStatus}
                                          >
                                           <SendIcon fontSize="small" />
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      {/* Remove Button */}
                                      <Tooltip title="Remove Suggestion">
                                        <span>
                                          <IconButton 
                                            aria-label="Remove suggestion"
                                            onClick={() => handleRemoveReview(index)}
                                            size="small"
                                            disabled={isUpdatingReviews || sendingStatus === 'sending' || isEditingOverview || isUpdatingStatus}
                                            sx={{ color: 'text.secondary', '&:hover': { color: 'error.main' } }}
                                          >
                                            {isUpdatingReviews ? <CircularProgress size={18} /> : <DeleteOutlineIcon fontSize="small" />}
                                          </IconButton>
                                        </span>
                                      </Tooltip>
                                      
                                    </Stack>
                                  }
                                  sx={{ pb: 0, alignItems: 'flex-start' }}
                                />
                                <CardContent sx={{ pt: 1 }}>
                                  <Rating value={review.rating || 5} readOnly precision={0.5} size="small" sx={{ mb: 1 }} />
                                  <Typography variant="body2" color="text.secondary" sx={{ whiteSpace: 'pre-wrap' }}> 
                                    {review.content}
                                  </Typography>
                                  <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 1.5, pt: 1, borderTop: '1px dashed', borderColor: 'divider' }}>
                                       <Typography variant="caption" color="text.secondary">Generated: {createdAt}</Typography>
                                       {sentAt && (
                                         <Typography variant="caption" color="text.secondary">Requested: {sentAt}</Typography>
                                       )}
                                  </Box>
                                </CardContent>
                             </Card>
                           );
                        })}
                       </Stack>
                   ) : (
                      <Typography variant="body2" color="text.secondary" sx={{mt: 2}}>
                        {isGeneratingReviews ? 'Generating first suggestions...' : 'No review suggestions generated yet. Use the controls above to create some!'}
            </Typography>
                   )}
          </Paper>
        </Grid>

          </Grid>
      )}
      
      <Snackbar 
        open={snackbar.open} 
        autoHideDuration={4000} 
        onClose={handleCloseSnackbar} 
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
       >
         <Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: '100%' }}>
           {snackbar.message}
         </Alert>
       </Snackbar>

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
           {currentReview && (
             <Box sx={{ mb: 3 }}>
               <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600 }}>Selected Review Suggestion</Typography>
               <Paper sx={{ p: {xs: 2, sm: 3}, bgcolor: '#f8f9fa', borderRadius: 2, border: '1px solid', borderColor: 'grey.200' }}>
                 <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1.5 }}>
                   <Box sx={{ display: 'flex', alignItems: 'center' }}>
                     <Rating value={currentReview.rating || 5} readOnly size="small" sx={{ mr: 1.5 }} />
                     <Typography variant="body1" color="text.primary" sx={{ fontWeight: 500, mr: 1 }}>
                        {currentReview.title || `Review for ${profileData?.analysis_data?.productName || profileData?.business_name}`}
                      </Typography>
                   </Box>
                   <Box>
                     {isEditingDialogReview ? (
                       <Stack direction="row" spacing={0.5}>
                          <Tooltip title="Save Changes for this Email">
                            <span>
                              <IconButton onClick={handleSaveDialogReviewEdit} size="small" color="success" disabled={sendingStatus === 'sending'}>
                                <SaveIcon fontSize="small" />
                              </IconButton>
                            </span>
                          </Tooltip>
                          <Tooltip title="Cancel Edit">
                             <span>
                               <IconButton onClick={handleCancelDialogReviewEdit} size="small" disabled={sendingStatus === 'sending'}>
                                 <CancelIcon fontSize="small" />
                               </IconButton>
                             </span>
                          </Tooltip>
                        </Stack>
                     ) : (
                        <Tooltip title="Edit Review Content for this Email">
                          <span>
                            <IconButton onClick={handleEditDialogReviewClick} size="small" disabled={sendingStatus === 'sending'}>
                              <EditNoteIcon fontSize="small" />
                            </IconButton>
                          </span>
                        </Tooltip>
                     )}
                   </Box>
                    </Box>
                 
                 {isEditingDialogReview ? (
                    <TextField
                      fullWidth
                      multiline
                      rows={4}
                      value={dialogReviewContent}
                      onChange={handleDialogReviewContentChange}
                      variant="outlined"
                      size="small"
                      autoFocus
                      disabled={sendingStatus === 'sending'}
                      sx={{ mt: 1, bgcolor: 'background.paper' }}
                    />
                  ) : (
                    <Typography variant="body2" sx={{ color: 'text.secondary', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                      {dialogReviewContent}
                    </Typography>
                  )}
               </Paper>
                  </Box>
           )}
           
           <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>Recipient Details</Typography>
           <Grid container spacing={2} sx={{ mb: 3 }}>
               <Grid item xs={12} md={6}>
                   <TextField fullWidth label="Recipient Name" name="toName" value={recipientData.toName} onChange={handleRecipientDataChange} required placeholder="Customer name" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
               </Grid>
               <Grid item xs={12} md={6}>
                   <TextField fullWidth label="Recipient Email" name="toEmail" value={recipientData.toEmail} onChange={handleRecipientDataChange} required placeholder="customer@example.com" type="email" sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }} />
        </Grid>
      </Grid>

           <FormControl component="fieldset" fullWidth sx={{ mb: 3 }}>
               <FormLabel component="legend" sx={{ mb: 1, fontWeight: 600, fontSize: '1rem' }}>Select Review Platforms to Include</FormLabel>
               <FormGroup>
                 {Object.entries(profileData?.platform_urls || {}).filter(([_, info]) => info.profileUrl).length > 0 ? (
                     Object.entries(profileData.platform_urls)
                       .filter(([_, info]) => info.profileUrl)
                       .map(([platform, info]) => {
                          const PlatformIcon = PLATFORM_ICONS[platform];
                          if (!PlatformIcon) return null;
                          return (
                             <FormControlLabel
                               key={platform}
                               control={<Checkbox checked={selectedPlatforms[platform] || false} onChange={() => handlePlatformDialogChange(platform)} name={platform} />}
                               label={
                                   <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                      <PlatformIcon sx={{ color: PLATFORM_COLORS[platform] || 'action.active', fontSize: 18 }} />
                                      <Typography variant="body2" sx={{ textTransform: 'capitalize' }}>{platform}</Typography>
                                   </Box>
                                }
                             />
                           );
                        })
                  ) : (
                    <Typography variant="body2" color="text.secondary" sx={{pl: 1}}>No platforms configured with URLs in Settings.</Typography>
                  )}
               </FormGroup>
                <FormHelperText>Links for selected platforms will be included in the email.</FormHelperText> 
           </FormControl>

           <Box sx={{ mb: 2 }}>
             <Button 
               variant="outlined"
               onClick={handleToggleEmailCustomization}
               size="small"
               sx={{ textTransform: 'none' }}
             >
               {showEmailCustomization ? 'Hide Email Customization' : 'Customize Email Template'}
             </Button>
           </Box>

           <Collapse in={showEmailCustomization} timeout="auto" unmountOnExit>
             <Paper variant="outlined" sx={{ p: { xs: 2, sm: 3 }, mb: 3, borderRadius: 2, borderColor: 'grey.200' }}>
                <Typography variant="subtitle1" gutterBottom sx={{ fontWeight: 600, mb: 2 }}>Email Details</Typography>
                <Stack spacing={2.5}>
                   <TextField 
                       fullWidth label="From Name" name="fromName" 
                       value={tempEmailSettings.fromName} 
                       onChange={handleTempEmailSettingsChange} 
                       size="small" 
                       disabled={sendingStatus === 'sending'}
                       sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                   />
                    
                    <Box>
                       <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>Subject</Typography>
                          <RegenerateButton 
                             onClick={() => handleRegenerateEmailPart('subject')} 
                             loading={regeneratingEmailPart.subject}
                             label="Regenerate Subject with AI"
                          />
                       </Box>
                       <TextField 
                          fullWidth
                          name="subject" 
                          value={tempEmailSettings.subject} 
                          onChange={handleTempEmailSettingsChange} 
                          required size="small" 
                          disabled={sendingStatus === 'sending' || regeneratingEmailPart.subject}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                    </Box>
                   
                   <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', mb: 1 }}>
                         <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary' }}>Email Content</Typography>
                         <RegenerateButton 
                            onClick={() => handleRegenerateEmailPart('content')} 
                            loading={regeneratingEmailPart.content}
                            label="Regenerate Content with AI"
                         />
                      </Box>
                       <Box sx={{ mb: 1.5, border: '1px dashed', borderColor: 'grey.300', p: 1, borderRadius: 1 }}>
                          <Typography variant="caption" display="block" sx={{ mb: 0.5, fontWeight: 500, color: 'text.secondary' }}>
                             Insert Variables:
                           </Typography>
                           <EmailVariableButton variable="{customerName}" icon={<PersonIcon sx={{ fontSize: 16 }} />} label="Customer Name" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                           <EmailVariableButton variable="{productName}" icon={<ShoppingBagIcon sx={{ fontSize: 16 }} />} label="Product Name" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                           <EmailVariableButton variable="{rating}" icon={<StarIcon sx={{ fontSize: 16 }} />} label="Rating" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                           <EmailVariableButton variable="{title}" icon={<TitleIcon sx={{ fontSize: 16 }} />} label="Review Title" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                           <EmailVariableButton variable="{reviewContent}" icon={<FormatQuoteIcon sx={{ fontSize: 16 }} />} label="Review Content" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                           <EmailVariableButton variable="{incentive}" icon={<LocalOfferIcon sx={{ fontSize: 16 }} />} label="Incentive" onClick={handleInsertVariable} disabled={sendingStatus === 'sending' || regeneratingEmailPart.content} />
                       </Box>
                       <TextField 
                          fullWidth
                          name="content" 
                          value={tempEmailSettings.content} 
                          onChange={handleTempEmailSettingsChange} 
                          required multiline rows={8}
                          size="small" 
                          inputRef={emailContentRef}
                          disabled={sendingStatus === 'sending' || regeneratingEmailPart.content}
                          sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                      />
                   </Box>

                   <Box>
                      <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                          <Typography variant="caption" sx={{ fontWeight: 500, color: 'text.secondary', mr: 1 }}>Incentive Text (Optional)</Typography>
                           <RegenerateButton 
                              onClick={() => handleRegenerateEmailPart('incentive')} 
                              loading={regeneratingEmailPart.incentive} // Need incentive state
                              label="Regenerate Incentive with AI"
                           />
                       </Box>
                       <TextField 
                           fullWidth /* label="Incentive Text (Optional)" */
                           name="incentive" 
                           value={tempEmailSettings.incentive} 
                           onChange={handleTempEmailSettingsChange} 
                           size="small" 
                           disabled={sendingStatus === 'sending' || regeneratingEmailPart.incentive} // Need incentive state
                           sx={{ '& .MuiOutlinedInput-root': { borderRadius: 2 } }}
                           helperText="This text will replace the {incentive} variable in the email content."
                       />
                     </Box>
                </Stack>
             </Paper>
           </Collapse>

           {sendingStatus === 'sending' && (
             <Alert severity="info" icon={<CircularProgress size={20} />} sx={{ mt: 2 }}>Sending...</Alert>
           )}
         </DialogContent>
         <DialogActions sx={{ p: 3, borderTop: '1px solid', borderColor: 'grey.100' }}>
            <Button onClick={handleCloseEmailDialog}>Cancel</Button>
            <Button onClick={handleSendReviewRequest} variant="contained" disabled={sendingStatus === 'sending'}>
              {sendingStatus === 'sending' ? 'Sending...' : 'Send Request'}
            </Button>
         </DialogActions>
       </Dialog>

       {/* --- Status Update Menu --- */}
       <Menu
          id={`status-menu-${statusMenuReviewIndex}`} // Dynamic ID
          anchorEl={statusMenuAnchorEl}
          open={Boolean(statusMenuAnchorEl) && statusMenuReviewIndex !== null} // Open only if anchor and index exist
          onClose={handleCloseStatusMenu}
          MenuListProps={{
            'aria-labelledby': 'update review status', // Button aria-label
          }}
          anchorOrigin={{
            vertical: 'bottom',
            horizontal: 'right',
          }}
          transformOrigin={{
            vertical: 'top',
            horizontal: 'right',
          }}
        >
          {/* Add other status options later if needed */} 
          <MenuItem onClick={() => handleUpdateReviewStatus(statusMenuReviewIndex, 'received')}>
            <ListItemIcon>
              <CheckCircleOutlineIcon fontSize="small" color="success"/>
            </ListItemIcon>
            <ListItemText>Mark as Received</ListItemText>
          </MenuItem>
          <MenuItem onClick={() => handleUpdateReviewStatus(statusMenuReviewIndex, 'new')}>
             {/* Add appropriate icon later */}
             <ListItemIcon><ReviewsIcon fontSize="small" /></ListItemIcon>
            <ListItemText>Mark as New</ListItemText>
          </MenuItem>
           {/* Add more statuses like 'Rejected' here */}
        </Menu>

    </Container>
  );
};

export default Dashboard; 