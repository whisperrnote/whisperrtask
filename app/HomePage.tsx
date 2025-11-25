'use client';

import React, { useState } from 'react';
import {
  Box,
  Tabs,
  Tab,
  useTheme,
} from '@mui/material';
import {
  Dashboard as DashboardIcon,
  ChecklistRtl as TasksIcon,
  CalendarMonth as CalendarIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { MainLayout, TaskList, TaskDialog, TaskDetails } from '@/app/components';
import { Dashboard } from '@/app/components/dashboard';
import { CalendarView } from '@/app/components/calendar';
import { SettingsPanel } from '@/app/components/settings';
import { useTask } from '@/app/context/TaskContext';

type TabValue = 'dashboard' | 'tasks' | 'calendar' | 'settings';

export default function HomePage() {
  const theme = useTheme();
  const { selectedTaskId } = useTask();
  const [activeTab, setActiveTab] = useState<TabValue>('dashboard');

  const handleTabChange = (_: React.SyntheticEvent, newValue: TabValue) => {
    setActiveTab(newValue);
  };

  return (
    <MainLayout>
      {/* Page Tabs */}
      <Box sx={{ mb: 3 }}>
        <Tabs
          value={activeTab}
          onChange={handleTabChange}
          sx={{
            '& .MuiTabs-indicator': {
              height: 3,
              borderRadius: 1.5,
            },
            '& .MuiTab-root': {
              textTransform: 'none',
              fontWeight: 500,
              fontSize: '0.95rem',
              minHeight: 48,
              px: 2,
            },
          }}
        >
          <Tab
            value="dashboard"
            label="Dashboard"
            icon={<DashboardIcon />}
            iconPosition="start"
          />
          <Tab
            value="tasks"
            label="Tasks"
            icon={<TasksIcon />}
            iconPosition="start"
          />
          <Tab
            value="calendar"
            label="Calendar"
            icon={<CalendarIcon />}
            iconPosition="start"
          />
          <Tab
            value="settings"
            label="Settings"
            icon={<SettingsIcon />}
            iconPosition="start"
          />
        </Tabs>
      </Box>

      {/* Tab Content */}
      <Box>
        {activeTab === 'dashboard' && <Dashboard />}
        {activeTab === 'tasks' && <TaskList />}
        {activeTab === 'calendar' && <CalendarView />}
        {activeTab === 'settings' && <SettingsPanel />}
      </Box>

      {/* Task Dialog */}
      <TaskDialog />

      {/* Task Details Drawer */}
      <TaskDetails />
    </MainLayout>
  );
}
