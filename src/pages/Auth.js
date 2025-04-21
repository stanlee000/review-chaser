import React, { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Container,
  Paper,
  Typography,
  TextField,
  Button,
  Box,
  Link,
  Alert,
  Divider,
  IconButton,
} from '@mui/material';
import GoogleIcon from '@mui/icons-material/Google';
import GitHubIcon from '@mui/icons-material/GitHub';
import LinkedInIcon from '@mui/icons-material/LinkedIn';
import { useAuth } from '../contexts/AuthContext';
import { supabase } from '../lib/supabase';

const Auth = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { signIn, signUp } = useAuth();
  const [isSignUp, setIsSignUp] = useState(false);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    companyName: '',
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    
    const trimmedEmail = formData.email.trim();

    if (!trimmedEmail) {
      setError('Please enter an email address.');
      return;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setError('Please enter a valid email address.');
      return;
    }

    if (!formData.password) {
        setError('Please enter a password.');
        return;
    }
    
    setLoading(true);

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(trimmedEmail, formData.password);
        if (signUpError) throw signUpError;
        
        const { error: signInError } = await signIn(trimmedEmail, formData.password);
        if (signInError) {
          if (signInError.message === 'Email not confirmed') {
             setError('Signup successful, but please check your Supabase settings. Email confirmation might still be required to sign in.');
             setLoading(false);
             return;
          }
          throw signInError;
        }
        
        navigate('/onboarding', { state: { companyName: formData.companyName } });
      } else {
        const { error } = await signIn(trimmedEmail, formData.password);
        if (error) throw error;
        navigate('/');
      }
    } catch (error) {
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleSocialAuth = async (provider) => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider,
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (error) {
      setError('Error signing in with ' + provider);
    }
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  return (
    <Container maxWidth="sm">
      <Box
        sx={{
          mt: 8,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
        }}
      >
        <Paper
          elevation={0}
          sx={{
            p: 4,
            width: '100%',
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 2,
          }}
        >
          <Typography
            component="h1"
            variant="h4"
            align="center"
            sx={{ mb: 3, fontWeight: 600 }}
          >
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </Typography>

          {error && (
            <Alert severity="error" sx={{ mb: 3 }}>
              {error}
            </Alert>
          )}

          <form onSubmit={handleSubmit}>
            <TextField
              margin="normal"
              required
              fullWidth
              label="Email Address"
              name="email"
              autoComplete="email"
              autoFocus
              value={formData.email}
              onChange={handleChange}
            />

            {isSignUp && (
              <TextField
                margin="normal"
                fullWidth
                label="Company Name"
                name="companyName"
                value={formData.companyName}
                onChange={handleChange}
              />
            )}

            <TextField
              margin="normal"
              required
              fullWidth
              name="password"
              label="Password"
              type="password"
              autoComplete={isSignUp ? 'new-password' : 'current-password'}
              value={formData.password}
              onChange={handleChange}
            />

            <Button
              type="submit"
              fullWidth
              variant="contained"
              sx={{ mt: 3, mb: 2, py: 1.5 }}
              disabled={loading}
            >
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </Button>

            <Divider sx={{ my: 3 }}>or continue with</Divider>

            <Box sx={{ display: 'flex', justifyContent: 'center', gap: 2 }}>
              <IconButton
                onClick={() => handleSocialAuth('google')}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <GoogleIcon />
              </IconButton>
              <IconButton
                onClick={() => handleSocialAuth('github')}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <GitHubIcon />
              </IconButton>
              <IconButton
                onClick={() => handleSocialAuth('linkedin')}
                sx={{
                  border: '1px solid',
                  borderColor: 'divider',
                  borderRadius: 2,
                  p: 1,
                }}
              >
                <LinkedInIcon />
              </IconButton>
            </Box>

            <Box sx={{ textAlign: 'center', mt: 2 }}>
              <Link
                component="button"
                variant="body2"
                onClick={() => setIsSignUp(!isSignUp)}
                sx={{ textDecoration: 'none' }}
              >
                {isSignUp
                  ? 'Already have an account? Sign in'
                  : "Don't have an account? Sign up"}
              </Link>
            </Box>
          </form>
        </Paper>
      </Box>
    </Container>
  );
};

export default Auth; 