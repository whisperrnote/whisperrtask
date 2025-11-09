import { Link } from '@tanstack/react-router'
import { useEffect } from 'react'
import {
  AppBar,
  Toolbar,
  IconButton,
  Drawer,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Badge,
  Box,
  Typography,
  useTheme,
} from '@mui/material'
import {
  Menu as MenuIcon,
  Home as HomeIcon,
  Dashboard as DashboardIcon,
  CheckCircle as CheckSquareIcon,
  Inbox as InboxIcon,
  Search as SearchIcon,
  Close as CloseIcon,
  Notifications as NotificationsIcon,
} from '@mui/icons-material'
import { CommandPalette } from './ui/CommandPalette'
import { useUIStore } from '../store/uiStore'
import { useNotificationStore } from '../store/notificationStore'

export default function Header() {
  const theme = useTheme()
  const { sidebarOpen, setSidebarOpen, commandPaletteOpen, setCommandPaletteOpen } = useUIStore()
  const { notifications } = useNotificationStore()
  const unreadCount = notifications.filter((n) => !n.read).length

  const navItems = [
    { label: 'Home', to: '/', icon: HomeIcon },
    { label: 'Workspaces', to: '/workspaces', icon: DashboardIcon },
    { label: 'My Tasks', to: '/tasks', icon: CheckSquareIcon },
    { label: 'Whisperr Hub', to: '/hub', icon: InboxIcon },
  ]

  return (
    <>
      <AppBar position="sticky" sx={{ bgcolor: theme.palette.background.paper }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setSidebarOpen(true)}
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, fontWeight: 'bold' }}>
            <Link to="/" style={{ textDecoration: 'none', color: 'inherit' }}>
              WhisperrTask
            </Link>
          </Typography>
          <IconButton
            color="inherit"
            component={Link}
            to="/hub"
            sx={{ mr: 1 }}
          >
            <Badge badgeContent={unreadCount} color="error">
              <NotificationsIcon />
            </Badge>
          </IconButton>
          <IconButton
            color="inherit"
            onClick={() => setCommandPaletteOpen(true)}
            sx={{ display: { xs: 'none', sm: 'flex' } }}
          >
            <SearchIcon />
          </IconButton>
        </Toolbar>
      </AppBar>

      <Drawer
        anchor="left"
        open={sidebarOpen}
        onClose={() => setSidebarOpen(false)}
      >
        <Box
          sx={{
            width: 280,
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
          }}
        >
          <Box
            sx={{
              p: 2,
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              borderBottom: `1px solid ${theme.palette.divider}`,
            }}
          >
            <Typography variant="h6" sx={{ fontWeight: 'bold' }}>
              WhisperrTask
            </Typography>
            <IconButton
              edge="end"
              onClick={() => setSidebarOpen(false)}
              size="small"
            >
              <CloseIcon />
            </IconButton>
          </Box>

          <List sx={{ flex: 1, p: 1 }}>
            {navItems.map((item) => (
              <ListItem
                key={item.to}
                component={Link}
                to={item.to}
                onClick={() => setSidebarOpen(false)}
                sx={{
                  mb: 1,
                  borderRadius: 1,
                  '&:hover': {
                    bgcolor: theme.palette.action.hover,
                  },
                }}
              >
                <ListItemIcon>
                  <item.icon />
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItem>
            ))}
          </List>
        </Box>
      </Drawer>

      <CommandPalette
        isOpen={commandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  )
}
