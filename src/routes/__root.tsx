import * as React from 'react'
import { Outlet, createRootRoute } from '@tanstack/react-router'
import { ThemeProvider, createTheme, CssBaseline, Box } from '@mui/material'
import Header from '../components/Header'
import { useUIStore } from '../store/uiStore'
import '../lib/system-init'

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#6366f1',
    },
    secondary: {
      main: '#8b5cf6',
    },
    background: {
      default: '#0f172a',
      paper: '#1e293b',
    },
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
  },
})

export const Route = createRootRoute({
  component: RootComponent,
})

function RootComponent() {
  const { setCommandPaletteOpen } = useUIStore()

  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setCommandPaletteOpen(true)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [setCommandPaletteOpen])

  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
        <Header />
        <Box component="main" sx={{ flex: 1 }}>
          <Outlet />
        </Box>
      </Box>
    </ThemeProvider>
  )
}
