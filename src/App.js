import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { supabase } from './lib/supabase';
import Navbar from './components/Navbar';
import Dashboard from './pages/Dashboard';
import ReviewGenerator from './pages/ReviewGenerator';
import ReviewWidget from './pages/ReviewWidget';
import Settings from './pages/Settings';
import Auth from './pages/Auth';
import OnboardingFlow from './components/onboarding/OnboardingFlow';
import WidgetGenerator from './components/widget/WidgetGenerator';
import AIReviewGenerator from './components/AIReviewGenerator';
import { theme } from './theme';

// Protected Route wrapper
const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (!user) {
    return <Navigate to="/auth" />;
  }

  return children;
};

// Public Route wrapper (redirects to dashboard if authenticated)
const PublicRoute = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return null; // Or a loading spinner
  }

  if (user) {
    return <Navigate to="/" />;
  }

  return children;
};

// Onboarding Route wrapper - REVISED
const OnboardingRoute = ({ children }) => {
  const { user, loading } = useAuth();
  const [isOnboardingComplete, setIsOnboardingComplete] = useState(null); // null | boolean
  const [isCheckingStatus, setIsCheckingStatus] = useState(true); // Track async check

  useEffect(() => {
    // Only run check if auth is loaded and we have a user
    if (!loading && user) {
      const checkOnboardingStatus = async () => {
        setIsCheckingStatus(true);
        try {
          const { data, error } = await supabase
            .from('business_profiles')
            .select('onboarding_completed')
            .eq('user_id', user.id)
            .single();

          // Handle cases: profile exists, doesn't exist, or other errors
          if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
            throw error;
          }
          
          setIsOnboardingComplete(data?.onboarding_completed || false); // Set state with result (default false if no profile)
        } catch (error) {
          console.error('Error checking onboarding status:', error);
          setIsOnboardingComplete(false); // Default to false on error
        } finally {
          setIsCheckingStatus(false); // Done checking
        }
      };
      checkOnboardingStatus();
    }
    // If auth is loading or no user, keep checking status
    if (loading || !user) {
       setIsCheckingStatus(true);
       setIsOnboardingComplete(null);
    }

  }, [user, loading]); // Re-run when user or loading state changes

  // --- Render Logic ---
  
  // 1. Handle Auth Loading
  if (loading) {
    return null; // Or a loading spinner
  }

  // 2. Redirect if not logged in
  if (!user) {
    return <Navigate to="/auth" />;
  }

  // 3. Handle Onboarding Status Check Loading
  if (isCheckingStatus) {
      return null; // Or a loading spinner while checking DB
  }

  // 4. Redirect to Dashboard if Onboarding is Complete
  if (isOnboardingComplete === true) {
    return <Navigate to="/" />;
  }

  // 5. Render Onboarding Flow if status checked and onboarding is not complete
  if (isOnboardingComplete === false) {
      return children;
  }
  
  // Fallback (should ideally not be reached)
  return <Navigate to="/auth" />; 
};

function AppContent() {
  const { user } = useAuth();

  return (
    <div className="App" style={{ backgroundColor: theme.palette.background.default, minHeight: '100vh' }}>
      {user && <Navbar />}
      <Routes>
        <Route
          path="/auth"
          element={
            <PublicRoute>
              <Auth />
            </PublicRoute>
          }
        />
        <Route
          path="/onboarding"
          element={
            <OnboardingRoute>
              <OnboardingFlow />
            </OnboardingRoute>
          }
        />
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Dashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/generator"
          element={
            <ProtectedRoute>
              <AIReviewGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/widget"
          element={
            <ProtectedRoute>
              <WidgetGenerator />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings"
          element={
            <ProtectedRoute>
              <Settings />
            </ProtectedRoute>
          }
        />
      </Routes>
    </div>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <Router>
          <AppContent />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App; 