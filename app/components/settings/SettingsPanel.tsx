'use client';

import React, { useState } from 'react';
import {
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  Divider,
  Button,
  Avatar,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  ListItemSecondaryAction,
  Chip,
  Alert,
  Tabs,
  Tab,
  useTheme,
  alpha,
  Grid,
} from '@mui/material';
import {
  Person as PersonIcon,
  Palette as ThemeIcon,
  Notifications as NotifIcon,
  Security as SecurityIcon,
  Extension as IntegrationIcon,
  Keyboard as KeyboardIcon,
  Language as LanguageIcon,
  Storage as DataIcon,
  HelpOutline as HelpIcon,
  Notes as NotesIcon,
  VideoCall as MeetIcon,
  Event as EventsIcon,
  CalendarMonth as CalIcon,
  Lock as PassIcon,
  Shield as AuthIcon,
  Check as CheckIcon,
  Link as LinkIcon,
  Settings as SettingsIcon,
} from '@mui/icons-material';
import { useThemeMode } from '@/app/theme/ThemeProvider';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel({ children, value, index }: TabPanelProps) {
  return (
    <div hidden={value !== index}>
      {value === index && <Box sx={{ py: 3 }}>{children}</Box>}
    </div>
  );
}

const ecosystemApps = [
  {
    id: 'whisperrnote',
    name: 'WhisperrNote',
    description: 'Link tasks to notes and documentation',
    icon: '📝',
    color: '#6366f1',
    connected: true,
  },
  {
    id: 'whisperrmeet',
    name: 'WhisperrMeet',
    description: 'Create tasks from meetings and action items',
    icon: '🎥',
    color: '#ec4899',
    connected: false,
  },
  {
    id: 'whisperrevents',
    name: 'WhisperrEvents',
    description: 'Sync tasks with events and milestones',
    icon: '🎉',
    color: '#f59e0b',
    connected: false,
  },
  {
    id: 'whisperrcal',
    name: 'WhisperrCal',
    description: 'View tasks in calendar and schedule time blocks',
    icon: '📅',
    color: '#3b82f6',
    connected: true,
  },
  {
    id: 'whisperrpass',
    name: 'WhisperrPass',
    description: 'Secure credential storage for task-related accounts',
    icon: '🔐',
    color: '#8b5cf6',
    connected: false,
  },
  {
    id: 'whisperrauth',
    name: 'WhisperrAuth',
    description: 'Single sign-on and multi-factor authentication',
    icon: '🛡️',
    color: '#ef4444',
    connected: true,
  },
];

const shortcuts = [
  { action: 'Create new task', keys: ['Ctrl', 'N'] },
  { action: 'Search tasks', keys: ['Ctrl', 'K'] },
  { action: 'Toggle sidebar', keys: ['Ctrl', 'B'] },
  { action: 'Mark task complete', keys: ['Ctrl', 'Enter'] },
  { action: 'Delete task', keys: ['Ctrl', 'Delete'] },
  { action: 'Open settings', keys: ['Ctrl', ','] },
  { action: 'Switch to list view', keys: ['Ctrl', '1'] },
  { action: 'Switch to board view', keys: ['Ctrl', '2'] },
  { action: 'Switch to calendar view', keys: ['Ctrl', '3'] },
  { action: 'Focus next task', keys: ['↓'] },
  { action: 'Focus previous task', keys: ['↑'] },
  { action: 'Edit focused task', keys: ['Enter'] },
];

export default function SettingsPanel() {
  const theme = useTheme();
  const { mode, setMode } = useThemeMode();
  const [tabValue, setTabValue] = useState(0);

  // Settings state
  const [notifications, setNotifications] = useState({
    email: true,
    push: true,
    reminders: true,
    mentions: true,
    taskAssigned: true,
    taskCompleted: false,
    projectUpdates: true,
  });

  const [preferences, setPreferences] = useState({
    startOfWeek: 0,
    dateFormat: 'MMM d, yyyy',
    timeFormat: '12h',
    language: 'en',
    showCompletedTasks: true,
    autoArchiveDays: 7,
  });

  const settingsTabs = [
    { label: 'Profile', icon: <PersonIcon /> },
    { label: 'Appearance', icon: <ThemeIcon /> },
    { label: 'Notifications', icon: <NotifIcon /> },
    { label: 'Integrations', icon: <IntegrationIcon /> },
    { label: 'Shortcuts', icon: <KeyboardIcon /> },
    { label: 'Data & Privacy', icon: <DataIcon /> },
  ];

  return (
    <Box>
      <Typography variant="h4" fontWeight={700} gutterBottom>
        Settings
      </Typography>
      <Typography variant="body1" color="text.secondary" sx={{ mb: 3 }}>
        Manage your account and application preferences
      </Typography>

      <Paper
        sx={{
          borderRadius: 3,
          border: `1px solid ${theme.palette.divider}`,
          overflow: 'hidden',
        }}
      >
        <Box sx={{ display: 'flex', minHeight: 600 }}>
          {/* Settings Sidebar */}
          <Box
            sx={{
              width: 240,
              borderRight: `1px solid ${theme.palette.divider}`,
              backgroundColor: alpha(theme.palette.text.primary, 0.02),
            }}
          >
            <Tabs
              orientation="vertical"
              value={tabValue}
              onChange={(_, newValue) => setTabValue(newValue)}
              sx={{
                '& .MuiTab-root': {
                  alignItems: 'flex-start',
                  textAlign: 'left',
                  px: 3,
                  py: 2,
                  minHeight: 48,
                  textTransform: 'none',
                  justifyContent: 'flex-start',
                  gap: 1.5,
                },
                '& .Mui-selected': {
                  backgroundColor: alpha(theme.palette.primary.main, 0.08),
                },
              }}
            >
              {settingsTabs.map((tab) => (
                <Tab
                  key={tab.label}
                  label={tab.label}
                  icon={tab.icon}
                  iconPosition="start"
                />
              ))}
            </Tabs>
          </Box>

          {/* Settings Content */}
          <Box sx={{ flex: 1, p: 3, overflow: 'auto' }}>
            {/* Profile Tab */}
            <TabPanel value={tabValue} index={0}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Profile Settings
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 3, mb: 4 }}>
                <Avatar
                  sx={{
                    width: 80,
                    height: 80,
                    fontSize: '2rem',
                    bgcolor: theme.palette.primary.main,
                  }}
                >
                  U
                </Avatar>
                <Box>
                  <Button variant="outlined" size="small" sx={{ mr: 1 }}>
                    Upload Photo
                  </Button>
                  <Button variant="text" size="small" color="error">
                    Remove
                  </Button>
                </Box>
              </Box>
              <Grid container spacing={3}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Full Name"
                    defaultValue="Demo User"
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField
                    fullWidth
                    label="Email"
                    defaultValue="user@whisperr.app"
                    disabled
                  />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Username" defaultValue="@demouser" />
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <TextField fullWidth label="Phone" placeholder="+1 (555) 000-0000" />
                </Grid>
                <Grid size={{ xs: 12 }}>
                  <TextField
                    fullWidth
                    label="Bio"
                    multiline
                    rows={3}
                    placeholder="Tell us about yourself..."
                  />
                </Grid>
              </Grid>
              <Box sx={{ mt: 3 }}>
                <Button variant="contained">Save Changes</Button>
              </Box>
            </TabPanel>

            {/* Appearance Tab */}
            <TabPanel value={tabValue} index={1}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Appearance
              </Typography>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Theme
                </Typography>
                <Box sx={{ display: 'flex', gap: 2 }}>
                  {(['light', 'dark', 'system'] as const).map((themeMode) => (
                    <Paper
                      key={themeMode}
                      onClick={() => setMode(themeMode)}
                      sx={{
                        p: 2,
                        cursor: 'pointer',
                        borderRadius: 2,
                        border: `2px solid ${
                          mode === themeMode
                            ? theme.palette.primary.main
                            : theme.palette.divider
                        }`,
                        minWidth: 100,
                        textAlign: 'center',
                      }}
                    >
                      <Box
                        sx={{
                          width: 48,
                          height: 32,
                          borderRadius: 1,
                          mx: 'auto',
                          mb: 1,
                          backgroundColor:
                            themeMode === 'light'
                              ? '#f8fafc'
                              : themeMode === 'dark'
                              ? '#0f172a'
                              : 'linear-gradient(135deg, #f8fafc 50%, #0f172a 50%)',
                          border: `1px solid ${theme.palette.divider}`,
                        }}
                      />
                      <Typography
                        variant="body2"
                        fontWeight={mode === themeMode ? 600 : 400}
                      >
                        {themeMode.charAt(0).toUpperCase() + themeMode.slice(1)}
                      </Typography>
                    </Paper>
                  ))}
                </Box>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Typography variant="subtitle2" gutterBottom>
                Display Options
              </Typography>
              <FormControlLabel
                control={
                  <Switch
                    checked={preferences.showCompletedTasks}
                    onChange={(e) =>
                      setPreferences({ ...preferences, showCompletedTasks: e.target.checked })
                    }
                  />
                }
                label="Show completed tasks in task lists"
              />
              <Box sx={{ mt: 3 }}>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Start of Week</InputLabel>
                  <Select
                    value={preferences.startOfWeek}
                    label="Start of Week"
                    onChange={(e) =>
                      setPreferences({ ...preferences, startOfWeek: Number(e.target.value) })
                    }
                  >
                    <MenuItem value={0}>Sunday</MenuItem>
                    <MenuItem value={1}>Monday</MenuItem>
                    <MenuItem value={6}>Saturday</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth sx={{ mb: 2 }}>
                  <InputLabel>Date Format</InputLabel>
                  <Select
                    value={preferences.dateFormat}
                    label="Date Format"
                    onChange={(e) =>
                      setPreferences({ ...preferences, dateFormat: e.target.value })
                    }
                  >
                    <MenuItem value="MMM d, yyyy">Dec 25, 2025</MenuItem>
                    <MenuItem value="d MMM yyyy">25 Dec 2025</MenuItem>
                    <MenuItem value="yyyy-MM-dd">2025-12-25</MenuItem>
                    <MenuItem value="MM/dd/yyyy">12/25/2025</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Time Format</InputLabel>
                  <Select
                    value={preferences.timeFormat}
                    label="Time Format"
                    onChange={(e) =>
                      setPreferences({ ...preferences, timeFormat: e.target.value })
                    }
                  >
                    <MenuItem value="12h">12-hour (2:30 PM)</MenuItem>
                    <MenuItem value="24h">24-hour (14:30)</MenuItem>
                  </Select>
                </FormControl>
              </Box>
            </TabPanel>

            {/* Notifications Tab */}
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Notification Preferences
              </Typography>
              <List>
                <ListItem>
                  <ListItemText
                    primary="Email Notifications"
                    secondary="Receive task updates via email"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.email}
                      onChange={(e) =>
                        setNotifications({ ...notifications, email: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Push Notifications"
                    secondary="Receive notifications in your browser"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.push}
                      onChange={(e) =>
                        setNotifications({ ...notifications, push: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <Divider />
                <ListItem>
                  <ListItemText
                    primary="Task Reminders"
                    secondary="Get reminded about upcoming due dates"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.reminders}
                      onChange={(e) =>
                        setNotifications({ ...notifications, reminders: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Mentions"
                    secondary="When someone mentions you in a comment"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.mentions}
                      onChange={(e) =>
                        setNotifications({ ...notifications, mentions: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Task Assigned"
                    secondary="When a task is assigned to you"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.taskAssigned}
                      onChange={(e) =>
                        setNotifications({ ...notifications, taskAssigned: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
                <ListItem>
                  <ListItemText
                    primary="Task Completed"
                    secondary="When someone completes a task you created"
                  />
                  <ListItemSecondaryAction>
                    <Switch
                      checked={notifications.taskCompleted}
                      onChange={(e) =>
                        setNotifications({ ...notifications, taskCompleted: e.target.checked })
                      }
                    />
                  </ListItemSecondaryAction>
                </ListItem>
              </List>
            </TabPanel>

            {/* Integrations Tab */}
            <TabPanel value={tabValue} index={3}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Whisperr Ecosystem
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Connect WhisperrTask with other apps in the Whisperr ecosystem for a seamless
                experience.
              </Typography>
              <Grid container spacing={2}>
                {ecosystemApps.map((app) => (
                  <Grid size={{ xs: 12, sm: 6 }} key={app.id}>
                    <Paper
                      sx={{
                        p: 2.5,
                        borderRadius: 2,
                        border: `1px solid ${
                          app.connected
                            ? alpha(app.color, 0.5)
                            : theme.palette.divider
                        }`,
                        backgroundColor: app.connected
                          ? alpha(app.color, 0.05)
                          : 'transparent',
                      }}
                    >
                      <Box
                        sx={{
                          display: 'flex',
                          alignItems: 'flex-start',
                          gap: 2,
                        }}
                      >
                        <Box
                          sx={{
                            width: 48,
                            height: 48,
                            borderRadius: 2,
                            backgroundColor: alpha(app.color, 0.15),
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '1.5rem',
                          }}
                        >
                          {app.icon}
                        </Box>
                        <Box sx={{ flex: 1 }}>
                          <Box
                            sx={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 1,
                              mb: 0.5,
                            }}
                          >
                            <Typography variant="subtitle1" fontWeight={600}>
                              {app.name}
                            </Typography>
                            {app.connected && (
                              <Chip
                                label="Connected"
                                size="small"
                                color="success"
                                icon={<CheckIcon />}
                                sx={{ height: 20, fontSize: '0.7rem' }}
                              />
                            )}
                          </Box>
                          <Typography variant="body2" color="text.secondary">
                            {app.description}
                          </Typography>
                          <Button
                            variant={app.connected ? 'text' : 'outlined'}
                            size="small"
                            sx={{ mt: 1.5 }}
                            startIcon={app.connected ? <SettingsIcon /> : <LinkIcon />}
                          >
                            {app.connected ? 'Configure' : 'Connect'}
                          </Button>
                        </Box>
                      </Box>
                    </Paper>
                  </Grid>
                ))}
              </Grid>

              <Divider sx={{ my: 4 }} />

              <Typography variant="h6" fontWeight={600} gutterBottom>
                Third-Party Integrations
              </Typography>
              <Alert severity="info" sx={{ mb: 2 }}>
                Third-party integrations coming soon! Connect with Slack, GitHub, Jira, and more.
              </Alert>
            </TabPanel>

            {/* Keyboard Shortcuts Tab */}
            <TabPanel value={tabValue} index={4}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Keyboard Shortcuts
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                Speed up your workflow with these keyboard shortcuts
              </Typography>
              <List>
                {shortcuts.map((shortcut) => (
                  <ListItem key={shortcut.action} sx={{ py: 1 }}>
                    <ListItemText primary={shortcut.action} />
                    <Box sx={{ display: 'flex', gap: 0.5 }}>
                      {shortcut.keys.map((key, i) => (
                        <React.Fragment key={key}>
                          <Chip
                            label={key}
                            size="small"
                            sx={{
                              height: 24,
                              fontFamily: 'monospace',
                              fontWeight: 600,
                              backgroundColor: alpha(theme.palette.text.primary, 0.08),
                            }}
                          />
                          {i < shortcut.keys.length - 1 && (
                            <Typography variant="body2" sx={{ alignSelf: 'center' }}>
                              +
                            </Typography>
                          )}
                        </React.Fragment>
                      ))}
                    </Box>
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            {/* Data & Privacy Tab */}
            <TabPanel value={tabValue} index={5}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Data & Privacy
              </Typography>
              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Export Your Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Download a copy of all your tasks, projects, and settings.
                </Typography>
                <Button variant="outlined">Export Data</Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box sx={{ mb: 4 }}>
                <Typography variant="subtitle2" gutterBottom>
                  Import Data
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Import tasks from other task management tools.
                </Typography>
                <Button variant="outlined">Import Data</Button>
              </Box>

              <Divider sx={{ my: 3 }} />

              <Box>
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Danger Zone
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                  Permanently delete your account and all associated data.
                </Typography>
                <Button variant="outlined" color="error">
                  Delete Account
                </Button>
              </Box>
            </TabPanel>
          </Box>
        </Box>
      </Paper>
    </Box>
  );
}
