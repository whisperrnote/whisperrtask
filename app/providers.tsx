'use client';

import React from 'react';
import { ThemeProvider } from '@/app/theme';
import { TaskProvider } from '@/app/context';

interface AppProvidersProps {
  children: React.ReactNode;
}

export function AppProviders({ children }: AppProvidersProps) {
  return (
    <ThemeProvider>
      <TaskProvider>
        {children}
      </TaskProvider>
    </ThemeProvider>
  );
}
