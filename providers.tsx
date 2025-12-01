'use client';

import React from 'react';
import { ThemeProvider } from '@/theme';
import { TaskProvider, AuthProvider } from '@/context';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <AuthProvider>
        <TaskProvider>
          {children}
        </TaskProvider>
      </AuthProvider>
    </ThemeProvider>
  );
}
