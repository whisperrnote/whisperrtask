'use client';

import React from 'react';
import { Box, useTheme, useMediaQuery } from '@mui/material';
import AppBar from '@/components/layout/AppBar';
import Sidebar from '@/components/layout/Sidebar';
import { useTask } from '@/context/TaskContext';

const DRAWER_WIDTH = 280;

interface MainLayoutProps {
  children: React.ReactNode;
}

export default function MainLayout({ children }: MainLayoutProps) {
  const theme = useTheme();
  const { sidebarOpen } = useTask();
  const isMobile = useMediaQuery(theme.breakpoints.down('md'));

  return (
    <Box sx={{ display: 'flex', minHeight: '100vh' }}>
      <AppBar />
      {/* Sidebar only visible on desktop */}
      {!isMobile && <Sidebar />}
      <Box
        component="main"
        sx={{
          flexGrow: 1,
          p: { xs: 2, md: 3 },
          pt: { xs: `calc(64px + 16px)`, md: `calc(64px + 24px)` }, // AppBar height + padding
          ml: { xs: 0, md: sidebarOpen ? `${DRAWER_WIDTH}px` : 0 },
          pb: { xs: '100px', md: 3 },
          transition: theme.transitions.create(['margin'], {
            easing: theme.transitions.easing.sharp,
            duration: theme.transitions.duration.leavingScreen,
          }),
          backgroundColor: theme.palette.background.default,
          minHeight: '100vh',
          boxSizing: 'border-box',
        }}
      >
        {children}
      </Box>
    </Box>
  );
}
