'use client';

import React, { useState } from 'react';
import {
  AppBar as MuiAppBar,
  Toolbar,
  IconButton,
  Typography,
  InputBase,
  Box,
  Avatar,
  Menu,
  MenuItem,
  Divider,
  Badge,
  Tooltip,
  ListItemIcon,
  ListItemText,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Menu as MenuIcon,
  Search as SearchIcon,
  Add as AddIcon,
  Notifications as NotificationsIcon,
  Settings as SettingsIcon,
  DarkMode as DarkModeIcon,
  LightMode as LightModeIcon,
  Logout as LogoutIcon,
  Person as PersonIcon,
  Help as HelpIcon,
  Keyboard as KeyboardIcon,
  Apps as AppsIcon,
} from '@mui/icons-material';
import { useTask } from '@/app/context/TaskContext';
import { useThemeMode } from '@/app/theme/ThemeProvider';

// Whisperr ecosystem apps
const ecosystemApps = [
  { name: 'WhisperrNote', icon: '📝', color: '#6366f1', description: 'Smart notes' },
  { name: 'WhisperrTask', icon: '✅', color: '#10b981', description: 'Task management', active: true },
  { name: 'WhisperrMeet', icon: '🎥', color: '#ec4899', description: 'Video meetings' },
  { name: 'WhisperrEvents', icon: '🎉', color: '#f59e0b', description: 'Event planning' },
  { name: 'WhisperrCal', icon: '📅', color: '#3b82f6', description: 'Calendar' },
  { name: 'WhisperrPass', icon: '🔐', color: '#8b5cf6', description: 'Password manager' },
  { name: 'WhisperrAuth', icon: '🛡️', color: '#ef4444', description: 'Authentication' },
];

export default function AppBar() {
  const theme = useTheme();
  const { mode, toggleMode } = useThemeMode();
  const { toggleSidebar, setSearchQuery, searchQuery, setTaskDialogOpen } = useTask();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const [appsAnchorEl, setAppsAnchorEl] = useState<null | HTMLElement>(null);
  const [notifAnchorEl, setNotifAnchorEl] = useState<null | HTMLElement>(null);

  const handleProfileClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleAppsClick = (event: React.MouseEvent<HTMLElement>) => {
    setAppsAnchorEl(event.currentTarget);
  };

  const handleNotifClick = (event: React.MouseEvent<HTMLElement>) => {
    setNotifAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
    setAppsAnchorEl(null);
    setNotifAnchorEl(null);
  };

  return (
    <MuiAppBar
      position="fixed"
      elevation={0}
      sx={{
        zIndex: theme.zIndex.drawer + 1,
        backgroundColor: theme.palette.background.paper,
        borderBottom: `1px solid ${theme.palette.divider}`,
      }}
    >
      <Toolbar sx={{ gap: 1 }}>
        {/* Menu Toggle */}
        <IconButton
          edge="start"
          color="inherit"
          aria-label="toggle sidebar"
          onClick={toggleSidebar}
          sx={{ color: theme.palette.text.primary }}
        >
          <MenuIcon />
        </IconButton>

        {/* Logo */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mr: 2 }}>
          <Box
            sx={{
              width: 32,
              height: 32,
              borderRadius: 1.5,
              background: 'linear-gradient(135deg, #6366f1 0%, #8b5cf6 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.2rem',
            }}
          >
            ✅
          </Box>
          <Typography
            variant="h6"
            noWrap
            component="div"
            sx={{
              fontWeight: 700,
              color: theme.palette.text.primary,
              display: { xs: 'none', sm: 'block' },
            }}
          >
            WhisperrTask
          </Typography>
        </Box>

        {/* Search */}
        <Box
          sx={{
            position: 'relative',
            borderRadius: 2,
            backgroundColor: alpha(theme.palette.text.primary, 0.05),
            '&:hover': {
              backgroundColor: alpha(theme.palette.text.primary, 0.08),
            },
            width: { xs: '100%', sm: 400 },
            maxWidth: '100%',
          }}
        >
          <Box
            sx={{
              padding: theme.spacing(0, 2),
              height: '100%',
              position: 'absolute',
              pointerEvents: 'none',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <SearchIcon sx={{ color: theme.palette.text.secondary }} />
          </Box>
          <InputBase
            placeholder="Search tasks... (Ctrl+K)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            sx={{
              color: theme.palette.text.primary,
              width: '100%',
              '& .MuiInputBase-input': {
                padding: theme.spacing(1.5, 1.5, 1.5, 0),
                paddingLeft: `calc(1em + ${theme.spacing(4)})`,
                width: '100%',
              },
            }}
          />
        </Box>

        <Box sx={{ flexGrow: 1 }} />

        {/* Actions */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
          {/* Add Task Button */}
          <Tooltip title="Add task (Ctrl+N)">
            <IconButton
              color="primary"
              onClick={() => setTaskDialogOpen(true)}
              sx={{
                backgroundColor: theme.palette.primary.main,
                color: '#fff',
                '&:hover': {
                  backgroundColor: theme.palette.primary.dark,
                },
              }}
            >
              <AddIcon />
            </IconButton>
          </Tooltip>

          {/* Ecosystem Apps */}
          <Tooltip title="Whisperr Apps">
            <IconButton
              onClick={handleAppsClick}
              sx={{ color: theme.palette.text.secondary }}
            >
              <AppsIcon />
            </IconButton>
          </Tooltip>

          {/* Theme Toggle */}
          <Tooltip title={`Switch to ${mode === 'dark' ? 'light' : mode === 'light' ? 'system' : 'dark'} mode`}>
            <IconButton
              onClick={toggleMode}
              sx={{ color: theme.palette.text.secondary }}
            >
              {mode === 'dark' ? <LightModeIcon /> : <DarkModeIcon />}
            </IconButton>
          </Tooltip>

          {/* Notifications */}
          <Tooltip title="Notifications">
            <IconButton
              onClick={handleNotifClick}
              sx={{ color: theme.palette.text.secondary }}
            >
              <Badge badgeContent={3} color="error">
                <NotificationsIcon />
              </Badge>
            </IconButton>
          </Tooltip>

          {/* Profile */}
          <Tooltip title="Account">
            <IconButton onClick={handleProfileClick} sx={{ ml: 1 }}>
              <Avatar
                sx={{
                  width: 36,
                  height: 36,
                  bgcolor: theme.palette.primary.main,
                  fontSize: '0.9rem',
                }}
              >
                U
              </Avatar>
            </IconButton>
          </Tooltip>
        </Box>

        {/* Profile Menu */}
        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 3,
            sx: { width: 240, mt: 1.5 },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box sx={{ px: 2, py: 1.5 }}>
            <Typography variant="subtitle1" fontWeight={600}>
              Demo User
            </Typography>
            <Typography variant="body2" color="text.secondary">
              user@whisperr.app
            </Typography>
          </Box>
          <Divider />
          <MenuItem>
            <ListItemIcon>
              <PersonIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Profile</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <SettingsIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Settings</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <KeyboardIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Keyboard shortcuts</ListItemText>
          </MenuItem>
          <MenuItem>
            <ListItemIcon>
              <HelpIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>Help & Support</ListItemText>
          </MenuItem>
          <Divider />
          <MenuItem sx={{ color: 'error.main' }}>
            <ListItemIcon>
              <LogoutIcon fontSize="small" color="error" />
            </ListItemIcon>
            <ListItemText>Sign out</ListItemText>
          </MenuItem>
        </Menu>

        {/* Apps Menu */}
        <Menu
          anchorEl={appsAnchorEl}
          open={Boolean(appsAnchorEl)}
          onClose={handleClose}
          onClick={handleClose}
          PaperProps={{
            elevation: 3,
            sx: { width: 320, mt: 1.5, p: 1 },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Typography variant="overline" sx={{ px: 1, color: 'text.secondary' }}>
            Whisperr Ecosystem
          </Typography>
          <Box
            sx={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: 0.5,
              mt: 1,
            }}
          >
            {ecosystemApps.map((app) => (
              <Box
                key={app.name}
                sx={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  p: 1.5,
                  borderRadius: 2,
                  cursor: 'pointer',
                  backgroundColor: app.active
                    ? alpha(theme.palette.primary.main, 0.1)
                    : 'transparent',
                  border: app.active
                    ? `1px solid ${theme.palette.primary.main}`
                    : '1px solid transparent',
                  '&:hover': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.05),
                  },
                }}
              >
                <Box
                  sx={{
                    width: 40,
                    height: 40,
                    borderRadius: 2,
                    backgroundColor: alpha(app.color, 0.15),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    fontSize: '1.5rem',
                    mb: 0.5,
                  }}
                >
                  {app.icon}
                </Box>
                <Typography
                  variant="caption"
                  sx={{
                    fontWeight: app.active ? 600 : 400,
                    textAlign: 'center',
                  }}
                >
                  {app.name.replace('Whisperr', '')}
                </Typography>
              </Box>
            ))}
          </Box>
        </Menu>

        {/* Notifications Menu */}
        <Menu
          anchorEl={notifAnchorEl}
          open={Boolean(notifAnchorEl)}
          onClose={handleClose}
          PaperProps={{
            elevation: 3,
            sx: { width: 360, mt: 1.5 },
          }}
          transformOrigin={{ horizontal: 'right', vertical: 'top' }}
          anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        >
          <Box
            sx={{
              px: 2,
              py: 1.5,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
            }}
          >
            <Typography variant="subtitle1" fontWeight={600}>
              Notifications
            </Typography>
            <Typography
              variant="body2"
              color="primary"
              sx={{ cursor: 'pointer' }}
            >
              Mark all read
            </Typography>
          </Box>
          <Divider />
          {[
            {
              title: 'Task due soon',
              message: '"Fix login bug" is due today',
              time: '5m ago',
              unread: true,
            },
            {
              title: 'Comment added',
              message: 'Sarah commented on "Design dashboard"',
              time: '1h ago',
              unread: true,
            },
            {
              title: 'Task completed',
              message: 'You completed "Set up CI/CD pipeline"',
              time: '2h ago',
              unread: true,
            },
          ].map((notif, index) => (
            <MenuItem
              key={index}
              sx={{
                py: 1.5,
                backgroundColor: notif.unread
                  ? alpha(theme.palette.primary.main, 0.05)
                  : 'transparent',
              }}
            >
              <Box>
                <Typography variant="body2" fontWeight={500}>
                  {notif.title}
                </Typography>
                <Typography variant="body2" color="text.secondary">
                  {notif.message}
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {notif.time}
                </Typography>
              </Box>
            </MenuItem>
          ))}
          <Divider />
          <MenuItem sx={{ justifyContent: 'center' }}>
            <Typography color="primary" variant="body2">
              View all notifications
            </Typography>
          </MenuItem>
        </Menu>
      </Toolbar>
    </MuiAppBar>
  );
}
