'use client';

import React from 'react';
import { usePathname } from 'next/navigation';
import { Box, useTheme, useMediaQuery, alpha } from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import BottomNav from '@/components/layout/BottomNav';
import { useTask } from '@/context/TaskContext';
import { TaskDialog } from '@/components';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const pathname = usePathname();
  const { sidebarOpen } = useTask();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  // Hide sidebar on event details pages
  const isEventPage = pathname?.startsWith('/events/') && pathname.split('/').length > 2;
  const showSidebar = !isMobile && !isEventPage;

  return (
    <Box
      sx={{
        display: 'flex',
        minHeight: '100vh',
        background: theme.palette.mode === 'light'
          ? 'radial-gradient(circle at top right, rgba(255,199,0,0.35), transparent 40%), #fff8ef'
          : '#050505',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <AppBar />
      {/* Sidebar only visible on desktop and not on event pages */}
      {showSidebar && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          px: { xs: 2, md: 3 },
          pt: { xs: `calc(64px + 16px)`, md: `calc(64px + 24px)` },
          pb: { xs: '100px', md: 3 },
          minHeight: '100vh',
          boxSizing: 'border-box',
          // Adjust width if sidebar is hidden
          maxWidth: showSidebar ? `calc(100vw - ${sidebarOpen ? DRAWER_WIDTH : 0}px)` : '100vw',
        }}
      >
        <Box
          sx={{
            background:
              theme.palette.mode === 'light'
                ? 'linear-gradient(180deg, rgba(255,255,255,0.85), rgba(255,255,255,0.95))'
                : 'linear-gradient(180deg, rgba(20,20,20,0.95), rgba(16,16,16,0.95))',
            borderRadius: { xs: 2, md: 3 },
            border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
            boxShadow:
              theme.palette.mode === 'light'
                ? '0px 30px 60px rgba(0,0,0,0.15)'
                : '0px 20px 60px rgba(0,0,0,0.6)',
            minHeight: '100%',
            p: { xs: 2, md: 3 },
            backdropFilter: 'blur(20px)',
            position: 'relative',
            overflow: 'hidden',
          }}
        >
        {children}
        </Box>
      </Box>
      {/* BottomNav only visible on mobile */}
      {isMobile && !isEventPage && <BottomNav />}
      
      {/* Global Dialogs */}
      <TaskDialog />
    </Box>
  );
}
