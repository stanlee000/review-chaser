import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';

const AuthContext = createContext({});

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      setLoading(false);
    };

    checkUser();

    // Listen for changes on auth state (sign in, sign out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signIn = async (email, password) => {
    try {
      const trimmedEmail = email?.trim();
      if (!trimmedEmail || typeof trimmedEmail !== 'string') {
        return { error: { message: 'Please enter a valid email address' } };
      }

      const { data, error } = await supabase.auth.signInWithPassword({
        email: trimmedEmail,
        password
      });
      
      if (error) return { error };
      return { data };
    } catch (error) {
      console.error('Error signing in:', error.message);
      return { error };
    }
  };

  const signUp = async (email, password) => {
    try {
      const trimmedEmail = email?.trim();
      if (!trimmedEmail || typeof trimmedEmail !== 'string') {
        return { error: { message: 'Please enter a valid email address' } };
      }

      const { data, error } = await supabase.auth.signUp({
        email: trimmedEmail,
        password,
      });
      
      if (error) return { error };
      return { data };
    } catch (error) {
      console.error('Error signing up:', error.message);
      return { error };
    }
  };

  const signOut = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
      setUser(null);
    } catch (error) {
      console.error('Error signing out:', error.message);
      throw error;
    }
  };

  const value = {
    user,
    loading,
    signIn,
    signUp,
    signOut
  };

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  );
}; 