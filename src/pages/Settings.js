import React, { useState, useEffect } from 'react';
import {
  Container,
  Grid,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Switch,
  FormControlLabel,
  Divider,
  Alert,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  ListItemSecondaryAction,
  IconButton,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Stack,
  CircularProgress,
  Tooltip,
  Checkbox,
  FormGroup,
  FormLabel,
  FormHelperText,
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import SaveIcon from '@mui/icons-material/Save';
import NotificationsIcon from '@mui/icons-material/Notifications';
import ApiIcon from '@mui/icons-material/Api';
import SecurityIcon from '@mui/icons-material/Security';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import EditNoteIcon from '@mui/icons-material/EditNote';
import MailOutlineIcon from '@mui/icons-material/MailOutline';
import SettingsIcon from '@mui/icons-material/Settings';
import LanguageIcon from '@mui/icons-material/Language';
import BusinessIcon from '@mui/icons-material/Business';
import TrustpilotIcon from '@mui/icons-material/Verified';
import CapterraIcon from '@mui/icons-material/AppRegistration';
import GoogleIcon from '@mui/icons-material/Google';
import G2Icon from '@mui/icons-material/Business';
import YelpIcon from '@mui/icons-material/Store';
import PersonIcon from '@mui/icons-material/Person';
import ShoppingBagIcon from '@mui/icons-material/ShoppingBag';
import FormatQuoteIcon from '@mui/icons-material/FormatQuote';
import LocalOfferIcon from '@mui/icons-material/LocalOffer';
import InsertEmoticonIcon from '@mui/icons-material/InsertEmoticon';
import AutorenewIcon from '@mui/icons-material/Autorenew';

// --- Constants for Platforms (Copied/Adapted) ---
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
    trustpilot: { prefix: 'https://www.trustpilot.com/review/', placeholder: 'company-name' },
    capterra: { prefix: 'https://www.capterra.com/p/', placeholder: 'id/slug' },
    google: { prefix: 'https://business.google.com/', placeholder: 'id' },
    g2: { prefix: 'https://www.g2.com/products/', placeholder: 'slug' },
    yelp: { prefix: 'https://www.yelp.com/biz/', placeholder: 'name' }
};

// --- Email Helper Components (Define if needed later) ---

// --- Helper Components (Copied/Adapted) ---
const EmailVariableButton = ({ variable, icon, label, onClick }) => (
    <Tooltip title={`Insert ${label}`}>
      <Button size="small" variant="outlined" onClick={onClick} startIcon={icon} sx={{ mr: 1, mb: 1, borderRadius: 2, textTransform: 'none', borderColor: 'grey.300', '&:hover': { borderColor: 'primary.main', bgcolor: 'primary.50' } }}>
        {label}
      </Button>
    </Tooltip>
  );
  
  const RegenerateButton = ({ onClick, loading }) => (
    <Tooltip title="Generate new AI version">
      <IconButton onClick={onClick} disabled={loading} sx={{ ml: 1, color: 'primary.main', '&:hover': { color: '#FFB400', bgcolor: 'rgba(255, 180, 0, 0.1)' }, '&.Mui-disabled': { color: 'grey.300' } }}>
        {loading ? <CircularProgress size={20} /> : <AutorenewIcon />}
      </IconButton>
    </Tooltip>
  );
// -------------------------------------------------------------

const Settings = () => {
  const navigate = useNavigate();
  const { user } = useAuth();

  const [profileLoading, setProfileLoading] = useState(true);
  const [profileError, setProfileError] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [saveError, setSaveError] = useState(null);

  const [companyName, setCompanyName] = useState('');
  const [website, setWebsite] = useState('');
  const [platformUrls, setPlatformUrls] = useState({});
  const [additionalContext, setAdditionalContext] = useState('');
  const [emailTemplate, setEmailTemplate] = useState({
    fromName: '',
    fromEmail: '',
    subject: '',
    content: '',
    incentive: '',
    tone: 'Professional'
  });
  const [regeneratingEmail, setRegeneratingEmail] = useState({ incentive: false, content: false });
  const [originalProfile, setOriginalProfile] = useState(null);

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) { 
        setProfileLoading(false);
        setProfileError("Not logged in.");
        return; 
      }
      setProfileLoading(true);
      setProfileError(null);
      try {
        const { data, error: dbError } = await supabase
          .from('business_profiles')
          .select('*')
          .eq('user_id', user.id)
          .single();

        if (dbError && dbError.code !== 'PGRST116') throw dbError;

        if (data) {
          setOriginalProfile(data);
          setCompanyName(data.business_name || '');
          setWebsite(data.website || '');
          setAdditionalContext(data.additional_context || '');
          
          // Initialize platformUrls correctly - STRIP PREFIX
          const initialPlatforms = {};
          Object.keys(PLATFORM_ICONS).forEach(pKey => {
            const fullUrl = data.platform_urls?.[pKey]?.profileUrl;
            const template = PLATFORM_URL_TEMPLATES[pKey];
            let valuePart = '';
            if (fullUrl && template && fullUrl.startsWith(template.prefix)) {
              valuePart = fullUrl.substring(template.prefix.length);
            }
            initialPlatforms[pKey] = { profileUrl: valuePart }; // Store only the value part
          });
          setPlatformUrls(initialPlatforms);
          
          // Initialize emailTemplate, ensure merge
          const defaultTemplate = { fromName: '', fromEmail: '', subject: '', content: '', incentive: '', tone: 'Professional' };
          setEmailTemplate({ 
              ...defaultTemplate, 
              ...(data.email_settings || {}), // Spread fetched settings over defaults
              // Ensure content/incentive are also pulled if stored separately (adjust if schema differs)
              content: data.email_settings?.content || defaultTemplate.content, 
              incentive: data.email_settings?.incentive || defaultTemplate.incentive, 
          });
        } else {
          setProfileError("No profile found. Please complete onboarding or setup.");
          setPlatformUrls(Object.keys(PLATFORM_ICONS).reduce((acc, key) => ({ ...acc, [key]: { profileUrl: '' } }), {}));
          setEmailTemplate({ fromName: '', fromEmail: '', subject: '', content: '', incentive: '', tone: 'Professional' });
        }
      } catch (err) {
        console.error('Error fetching profile:', err);
        setProfileError('Failed to load settings data.');
      } finally {
        setProfileLoading(false);
      }
    };
    fetchProfile();
  }, [user]);

  // --- Handlers --- 
  
  // Basic input change handler
  const handleChange = (e) => {
    const { name, value } = e.target;
    if (name === 'companyName') setCompanyName(value);
    else if (name === 'website') setWebsite(value);
    else if (name === 'additionalContext') setAdditionalContext(value);
    // Handle basic email fields
    else if (['fromName', 'fromEmail', 'subject', 'incentive', 'content', 'tone'].includes(name)) {
        handleEmailTemplateChange(e); 
    }
  };
  
  // Platform URL change handler
  const handlePlatformUrlChange = (platform, value) => {
    setPlatformUrls(prev => ({
        ...prev,
        [platform]: { ...prev[platform], profileUrl: value } 
    }));
  };

  // Email Template Handlers (Copied/Adapted)
  const handleEmailTemplateChange = (e) => {
    const { name, value } = e.target;
    setEmailTemplate(prev => ({ ...prev, [name]: value }));
  };

  const insertVariable = (variable) => {
    const field = document.getElementById('settingsEmailContent'); // Unique ID
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
  
  const handleRegenerateContent = async (type) => {
    // TODO: Implement API call if regeneration is needed here
    console.log('Regenerate content for:', type); 
    setRegeneratingEmail(prev => ({ ...prev, [type]: true }));
    // Mock delay
    await new Promise(resolve => setTimeout(resolve, 1000)); 
    // Update with dummy text for now
    setEmailTemplate(prev => ({ ...prev, [type]: `Regenerated ${type} content...` }));
    setRegeneratingEmail(prev => ({ ...prev, [type]: false }));
  };

  // --- Save Handler --- 
  const handleSave = async () => {
    if (!user) {
      setSaveError("Cannot save settings: User not found.");
      return;
    }
    setIsSaving(true);
    setSaveSuccess(false);
    setSaveError(null);

    // Construct full platform URLs before saving
    const fullPlatformUrls = {};
    Object.entries(platformUrls).forEach(([pKey, { profileUrl }]) => {
      const template = PLATFORM_URL_TEMPLATES[pKey];
      if (profileUrl && template) {
        fullPlatformUrls[pKey] = { profileUrl: `${template.prefix}${profileUrl}` };
      } else {
        fullPlatformUrls[pKey] = { profileUrl: '' }; // Store empty if no value
      }
    });

    const updateData = {
      user_id: user.id,
      business_name: companyName,
      website: website,
      platform_urls: fullPlatformUrls, // Save the constructed full URLs
      additional_context: additionalContext,
      email_settings: emailTemplate, // Save the whole email template object
      // Add other fields as needed
    };

    try {
      let result;
      if (originalProfile) {
        // Update existing profile
        result = await supabase
          .from('business_profiles')
          .update(updateData)
          .eq('user_id', user.id)
          .select() // Select to get the updated data back
          .single();
      } else {
        // Insert new profile
        result = await supabase
          .from('business_profiles')
          .insert(updateData)
          .select()
          .single();
      }

      const { data: updatedProfile, error: saveDbError } = result;

      if (saveDbError) throw saveDbError;

      // Update original profile state after successful save
      if (updatedProfile) {
          setOriginalProfile(updatedProfile);
          // Re-initialize form states based on the saved data to reflect any backend processing/defaults
          setCompanyName(updatedProfile.business_name || '');
          setWebsite(updatedProfile.website || '');
          setAdditionalContext(updatedProfile.additional_context || '');
          
          // Re-initialize platformUrls correctly - STRIP PREFIX
          const updatedPlatforms = {};
          Object.keys(PLATFORM_ICONS).forEach(pKey => {
            const fullUrl = updatedProfile.platform_urls?.[pKey]?.profileUrl;
            const template = PLATFORM_URL_TEMPLATES[pKey];
            let valuePart = '';
            if (fullUrl && template && fullUrl.startsWith(template.prefix)) {
              valuePart = fullUrl.substring(template.prefix.length);
            }
            updatedPlatforms[pKey] = { profileUrl: valuePart };
          });
          setPlatformUrls(updatedPlatforms);
          
          const defaultTemplate = { fromName: '', fromEmail: '', subject: '', content: '', incentive: '', tone: 'Professional' };
          setEmailTemplate({ 
              ...defaultTemplate, 
              ...(updatedProfile.email_settings || {}),
              content: updatedProfile.email_settings?.content || defaultTemplate.content, 
              incentive: updatedProfile.email_settings?.incentive || defaultTemplate.incentive, 
          });
      }

      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3s

    } catch (err) {
      console.error('Error saving settings:', err);
      setSaveError(`Failed to save settings: ${err.message || 'Unknown error'}`);
    } finally {
      setIsSaving(false);
    }
  };

  // --- Loading/Error States ---
  if (profileLoading) {
    return <Container sx={{ py: 4 }}><Box display="flex" justifyContent="center"><CircularProgress /></Box></Container>;
  }
  if (profileError) {
    return <Container sx={{ py: 4 }}><Alert severity="error">{profileError}</Alert></Container>;
  }

  // --- Render ---
  return (
    <Container sx={{ py: 4 }}>
      <Stack direction="row" alignItems="center" spacing={1} mb={3}>
        <IconButton onClick={() => navigate(-1)}>
          <ArrowBackIcon />
        </IconButton>
        <SettingsIcon />
        <Typography variant="h5" component="h1">
          Settings
        </Typography>
      </Stack>

      <Grid container spacing={3}>

        {/* Business Profile Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <BusinessIcon />
              <Typography variant="h6">Business Profile</Typography>
            </Stack>
            <TextField
              fullWidth
              label="Company Name"
              name="companyName"
              value={companyName}
              onChange={handleChange}
              margin="normal"
            />
             <TextField
              fullWidth
              label="Website URL"
              name="website"
              value={website}
              onChange={handleChange}
              margin="normal"
              type="url"
              placeholder="https://yourcompany.com"
            />
            <TextField
              fullWidth
              label="Additional Context for AI"
              name="additionalContext"
              value={additionalContext}
              onChange={handleChange}
              margin="normal"
              multiline
              rows={4}
              placeholder="e.g., Key products/services, target audience, unique selling points..."
              helperText="Provide details to help the AI generate more relevant review requests."
            />
          </Paper>
        </Grid>

        {/* Website / Platforms Section */}
        <Grid item xs={12}>
          <Paper elevation={2} sx={{ p: 3 }}>
            <Stack direction="row" alignItems="center" spacing={1} mb={2}>
              <LanguageIcon />
              <Typography variant="h6">Website / Platforms</Typography>
            </Stack>
            <Typography variant="body2" color="text.secondary" mb={2}>
              Enter the specific part of your profile URL for each platform (e.g., 'your-company-name' for Trustpilot).
            </Typography>
            {Object.entries(PLATFORM_URL_TEMPLATES).map(([key, { prefix, placeholder }]) => {
                const PlatformIcon = PLATFORM_ICONS[key];
                const platformColor = PLATFORM_COLORS[key] || '#000'; // Default color if not found
                return (
                    <Stack key={key} direction="row" alignItems="center" spacing={1} sx={{ mt: 2 }}>
                       <PlatformIcon sx={{ color: platformColor, fontSize: 28 }}/> 
                       <TextField
                        fullWidth
                        label={`${key.charAt(0).toUpperCase() + key.slice(1)} Profile`}
                        value={platformUrls[key]?.profileUrl || ''}
                        onChange={(e) => handlePlatformUrlChange(key, e.target.value)}
                        placeholder={placeholder}
                        InputProps={{
                            startAdornment: (
                                <Typography variant="body2" color="text.secondary" sx={{ mr: 0.5 }}>
                                    {prefix}
                                </Typography>
                            ),
                        }}
                        />
                    </Stack>
                )
            })}
          </Paper>
        </Grid>


        {/* Save Button and Messages */}
        <Grid item xs={12} sx={{ mt: 2 }}>
          <Box display="flex" justifyContent="flex-end" alignItems="center">
            {saveSuccess && <Alert severity="success" sx={{ mr: 2 }}>Settings saved successfully!</Alert>}
            {saveError && <Alert severity="error" sx={{ mr: 2 }}>{saveError}</Alert>}
            <Button
              variant="contained"
              color="primary"
              onClick={handleSave}
              disabled={isSaving}
              startIcon={isSaving ? <CircularProgress size={20} color="inherit" /> : <SaveIcon />}
            >
              {isSaving ? 'Saving...' : 'Save Settings'}
            </Button>
          </Box>
        </Grid>

      </Grid> {/* End Main Grid Container */}
    </Container>
  );
};

export default Settings; 