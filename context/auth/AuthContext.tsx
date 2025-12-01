'use client';

import React, { createContext, useContext, useEffect, useState, useCallback, ReactNode } from 'react';
import { usePathname } from 'next/navigation';
import { Models } from 'appwrite';
import { account } from '@/lib/appwrite';
import { APPWRITE_CONFIG } from '@/lib/config';
import { Backdrop, CircularProgress, Typography, Box, Button } from '@mui/material';
import Image from 'next/image';
import { APP_CONFIG } from '@/lib/constants';

interface AuthState {
  user: Models.User<Models.Preferences> | null;
  isLoading: boolean;
  isAuthenticated: boolean;
}

interface AuthContextType extends AuthState {
  logout: () => Promise<void>;
  checkSession: () => Promise<void>;
  openLoginPopup: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const AUTH_URL = `https://${APPWRITE_CONFIG.AUTH.SUBDOMAIN}.${APPWRITE_CONFIG.AUTH.DOMAIN}/login`;

// Routes that don't require authentication (public routes)
// These are pages that can be viewed without logging in
const PUBLIC_ROUTES: (string | RegExp)[] = [
  '/',                    // Landing page (redirects to dashboard, but should load first)
  '/events',              // Browse public events - discovery page
  /^\/events\/[^/]+$/,    // /events/[eventId] - individual event pages
];

function isPublicRoute(pathname: string): boolean {
  return PUBLIC_ROUTES.some(pattern => {
    if (typeof pattern === 'string') {
      return pathname === pattern;
    }
    return pattern.test(pathname);
  });
}

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
  const pathname = usePathname();
  const [user, setUser] = useState<Models.User<Models.Preferences> | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [showAuthOverlay, setShowAuthOverlay] = useState(false);
  const [authWindow, setAuthWindow] = useState<Window | null>(null);

  // Check if current route is public
  const isOnPublicRoute = isPublicRoute(pathname);

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
      // Only show auth overlay if NOT on a public route
      if (!isPublicRoute(pathname)) {
        setShowAuthOverlay(true);
      }
    } finally {
      setIsLoading(false);
    }
  }, [authWindow, pathname]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  // Update overlay visibility when route changes
  useEffect(() => {
    if (!user && !isLoading) {
      setShowAuthOverlay(!isOnPublicRoute);
    }
  }, [pathname, user, isLoading, isOnPublicRoute]);

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

  const openLoginPopup = useCallback(() => {
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
  }, []);

  const logout = async () => {
    try {
      await account.deleteSession('current');
      setUser(null);
      // Only show overlay if not on public route
      if (!isOnPublicRoute) {
        setShowAuthOverlay(true);
      }
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
    <AuthContext.Provider value={{ user, isLoading, isAuthenticated: !!user, logout, checkSession, openLoginPopup }}>
      {showAuthOverlay && !isOnPublicRoute ? (
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
              backgroundColor: 'rgba(0, 0, 0, 0.85)',
              display: 'flex',
              flexDirection: 'column',
              gap: 3,
            }}
          >
            <Box
              sx={{
                width: 80,
                height: 80,
                borderRadius: 3,
                overflow: 'hidden',
                boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3)',
                mb: 1,
              }}
            >
              <Image
                src={APP_CONFIG.logo.url}
                alt={APP_CONFIG.logo.alt}
                width={80}
                height={80}
                style={{ objectFit: 'cover' }}
                priority
              />
            </Box>
            <Typography variant="h4" fontWeight="bold">
              Welcome to {APP_CONFIG.name}
            </Typography>
            <Typography variant="body1" align="center" sx={{ maxWidth: 400, opacity: 0.9 }}>
              Please sign in with your Whisperr account to access your tasks and workflows.
            </Typography>
            <Button
              variant="contained"
              size="large"
              onClick={openLoginPopup}
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

