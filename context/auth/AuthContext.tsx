'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { Models } from 'appwrite';
import { account } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/config';
import { Backdrop, CircularProgress, Typography, Box, Button } from '@mui/material';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_URL = `https://${APPWRITE_CONFIG.AUTH.SUBDOMAIN}.${APPWRITE_CONFIG.AUTH.DOMAIN}/login`;

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

export function AuthProvider({ children }: AuthProviderProps) {
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  const checkSession = useCallback(async () => {
    try {
      const currentUser = await account.get();
      setUser(currentUser);
      setShowAuthOverlay(false);
      if (authWindow) {
        authWindow.close();
        setAuthWindow(null);
      }
    } catch (error) {
      console.warn('No active session found', error);
      setUser(null);
      setShowAuthOverlay(true);
    } finally {
      setIsLoading(false);
    }
  }, [authWindow]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Poll for session when overlay is active
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (showAuthOverlay) {
      interval = setInterval(() => {
        // We do a "silent" check (maybe just Account.get) to see if session is established
        // We won't trigger full loading state, just check
        account.get()
          .then((currentUser) => {
            setUser(currentUser);
            setShowAuthOverlay(false);
            if (authWindow) {
              authWindow.close();
              setAuthWindow(null);
            }
          })
          .catch(() => {
            // Still no session
          });
      }, 2000);
    }
    return () => clearInterval(interval);
  }, [showAuthOverlay, authWindow]);

  const handleLogin = () => {
    // Open the auth app in a popup
    const width = 500;
    const height = 600;
    const left = window.screen.width / 2 - width / 2;
    const top = window.screen.height / 2 - height / 2;
    
    const win = window.open(
      AUTH_URL,
      'WhisperrAuth',
      `width=${width},height=${height},left=${left},top=${top},resizable=yes,scrollbars=yes,status=yes`
    );
    setAuthWindow(win);
  };

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      setShowAuthOverlay(true);
    } catch (error) {
      console.error('Logout failed', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', height: '100vh', alignItems: 'center', justifyContent: 'center' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, logout, checkSession }}>
      {showAuthOverlay ? (
        <Box sx={{ position: 'relative', height: '100vh', overflow: 'hidden' }}>
          {/* Blurred Background Content */}
          <Box sx={{ filter: 'blur(8px)', pointerEvents: 'none', height: '100%' }}>
            {children}
          </Box>
          
          {/* Auth Overlay */}
          <Backdrop
            open={true}
            sx={{
              zIndex: (theme) => theme.zIndex.drawer + 9999,
              color: '#fff',
              backgroundColor: 'rgba(0, 0, 0, 0.7)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Typography variant="h4" fontWeight="bold">
              Welcome to WhisperrFlow
            </Typography>
            <Typography variant="body1" align="center" sx={{ maxWidth: 400 }}>
              Please sign in with your Whisperr account to access your tasks and workflows.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={handleLogin}
              sx={{
                px: 4,
                py: 1.5,
                fontSize: '1.1rem',
                borderRadius: 2,
                textTransform: 'none',
              }}
            >
              Sign In
            </Button>
          </Backdrop>
        </Box>
      ) : (
        children
      )}
    </AuthContext.Provider>
  );
}

