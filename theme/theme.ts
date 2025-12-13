'use client';

import { createTheme, ThemeOptions, alpha } from '@mui/material/styles';

const getDesignTokens = (mode: 'light' | 'dark'): ThemeOptions => ({
  palette: {
    mode,
    primary: {
      main: '#FFC700', // Sun yellow
      light: '#FFCF40',
      dark: '#D6A300',
      contrastText: '#1a1a1a',
    },
    secondary: {
      main: '#8B5CF6', // Purple accent
      light: '#A78BFA',
      dark: '#7C3AED',
      contrastText: '#ffffff',
    },
    success: {
      main: '#10b981',
      light: '#34d399',
      dark: '#059669',
    },
    warning: {
      main: '#F59E0B',
      light: '#FBBF24',
      dark: '#D97706',
    },
    error: {
      main: '#ef4444',
      light: '#f87171',
      dark: '#dc2626',
    },
    info: {
      main: '#8B5CF6',
      light: '#A78BFA',
      dark: '#7C3AED',
    },
    background: {
      default: mode === 'light' ? '#f8f8f8' : '#0f0f0f',
      paper: mode === 'light' ? '#ffffff' : '#1a1a1a',
    },
    text: {
      primary: mode === 'light' ? '#0f0a08' : '#faf8f6',
      secondary: mode === 'light' ? '#3d2f26' : '#c4b5a8',
    },
    divider: mode === 'light' ? '#e8e8e8' : '#2a2a2a',
  },
  typography: {
    fontFamily: '"Inter", "Roboto", "Helvetica", "Arial", sans-serif',
    h1: {
      fontSize: '2.5rem',
      fontWeight: 700,
      lineHeight: 1.2,
    },
    h2: {
      fontSize: '2rem',
      fontWeight: 600,
      lineHeight: 1.3,
    },
    h3: {
      fontSize: '1.5rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h4: {
      fontSize: '1.25rem',
      fontWeight: 600,
      lineHeight: 1.4,
    },
    h5: {
      fontSize: '1.125rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    h6: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle1: {
      fontSize: '1rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    subtitle2: {
      fontSize: '0.875rem',
      fontWeight: 500,
      lineHeight: 1.5,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: 1.6,
    },
    body2: {
      fontSize: '0.875rem',
      lineHeight: 1.6,
    },
    button: {
      textTransform: 'none',
      fontWeight: 600,
    },
    caption: {
      fontSize: '0.75rem',
      lineHeight: 1.5,
    },
    overline: {
      fontSize: '0.75rem',
      fontWeight: 600,
      letterSpacing: '0.08em',
      textTransform: 'uppercase',
    },
  },
  shape: {
    borderRadius: 16,
  },
  shadows: [
    'none',
    '0px 1px 2px rgba(0, 0, 0, 0.05)',
    '0px 1px 3px rgba(0, 0, 0, 0.1), 0px 1px 2px rgba(0, 0, 0, 0.06)',
    '0px 4px 6px -1px rgba(0, 0, 0, 0.1), 0px 2px 4px -1px rgba(0, 0, 0, 0.06)',
    '0px 10px 15px -3px rgba(0, 0, 0, 0.1), 0px 4px 6px -2px rgba(0, 0, 0, 0.05)',
    '0px 20px 25px -5px rgba(0, 0, 0, 0.1), 0px 10px 10px -5px rgba(0, 0, 0, 0.04)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
    '0px 25px 50px -12px rgba(0, 0, 0, 0.25)',
  ],
  components: {
    MuiCssBaseline: {
      styleOverrides: {
        body: {
          scrollbarColor: '#6b6b6b #2b2b2b',
          '&::-webkit-scrollbar, & *::-webkit-scrollbar': {
            width: 8,
            height: 8,
          },
          '&::-webkit-scrollbar-thumb, & *::-webkit-scrollbar-thumb': {
            borderRadius: 8,
            backgroundColor: '#6b6b6b',
            minHeight: 24,
          },
          '&::-webkit-scrollbar-track, & *::-webkit-scrollbar-track': {
            backgroundColor: 'transparent',
          },
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          borderRadius: 10,
          padding: '10px 20px',
          fontWeight: 600,
        },
        contained: ({ theme }) => ({
          backgroundImage:
            theme.palette.mode === 'light'
              ? 'linear-gradient(135deg, #fff59d, #ffc700)'
              : `linear-gradient(135deg, ${alpha(theme.palette.primary.light, 0.65)}, ${
                  theme.palette.primary.main
                })`,
          color: '#1a1a1a',
          boxShadow: '0px 12px 40px rgba(0, 0, 0, 0.15)',
          '&:hover': {
            boxShadow: '0px 16px 50px rgba(0, 0, 0, 0.25)',
          },
        }),
        outlined: {
          border: '1px solid',
          borderColor: alpha('#FFC700', 0.6),
        },
      },
    },
    MuiAppBar: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.92)'
              : 'rgba(18, 18, 18, 0.85)',
          borderBottom: `1px solid ${alpha(theme.palette.primary.main, 0.4)}`,
          backdropFilter: 'blur(24px)',
          boxShadow: '0px 25px 60px rgba(0, 0, 0, 0.20)',
        }),
      },
    },
    MuiCard: {
      styleOverrides: {
        root: ({ theme }) => ({
          borderRadius: 18,
          boxShadow:
            theme.palette.mode === 'light'
              ? '0px 25px 60px rgba(0, 0, 0, 0.12)'
              : '0px 10px 40px rgba(0, 0, 0, 0.45)',
          border: `1px solid ${alpha(theme.palette.primary.main, 0.25)}`,
        }),
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: ({ theme }) => ({
          backgroundColor:
            theme.palette.mode === 'light'
              ? 'rgba(255, 255, 255, 0.95)'
              : 'rgba(26, 26, 26, 0.85)',
          borderRadius: 20,
          padding: 0,
          boxShadow:
            theme.palette.mode === 'light'
              ? '0px 25px 55px rgba(0, 0, 0, 0.15)'
              : '0px 12px 40px rgba(0, 0, 0, 0.55)',
          border: `1px solid ${alpha(theme.palette.primary.main, theme.palette.mode === 'light' ? 0.35 : 0.1)}`,
          backdropFilter: 'blur(24px)',
          backgroundImage:
            theme.palette.mode === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.65), rgba(255,255,255,0.4))'
              : 'none',
        }),
      },
    },
    MuiChip: {
      styleOverrides: {
        root: {
          fontWeight: 500,
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: ({ theme }) => ({
          borderRight: 'none',
          boxShadow: '0px 35px 80px rgba(0, 0, 0, 0.15)',
          background:
            theme.palette.mode === 'light'
              ? 'linear-gradient(180deg, rgba(255,255,255,0.95), rgba(255,255,255,0.88))'
              : 'linear-gradient(180deg, rgba(32,32,32,0.95), rgba(24,24,24,0.90))',
          backdropFilter: 'blur(20px)',
          borderRadius: '0 24px 24px 0',
        }),
      },
    },
    MuiListItemButton: {
      styleOverrides: {
        root: {
          borderRadius: 8,
          margin: '2px 8px',
          '&.Mui-selected': {
            background:
              'linear-gradient(135deg, rgba(255, 199, 0, 0.2), rgba(255, 199, 0, 0.05))',
            boxShadow: '0px 10px 30px rgba(255, 199, 0, 0.2)',
          },
          '&:hover': {
            background: 'rgba(255, 199, 0, 0.08)',
          },
        },
      },
    },
    MuiTextField: {
      styleOverrides: {
        root: {
          '& .MuiOutlinedInput-root': {
            borderRadius: 8,
          },
        },
      },
    },
    MuiDialog: {
      styleOverrides: {
        paper: {
          borderRadius: 16,
        },
      },
    },
    MuiFab: {
      styleOverrides: {
        root: {
          boxShadow: '0px 4px 14px rgba(0, 0, 0, 0.15)',
        },
      },
    },
    MuiLinearProgress: {
      styleOverrides: {
        root: {
          borderRadius: 4,
          height: 6,
        },
      },
    },
    MuiAvatar: {
      styleOverrides: {
        root: {
          fontWeight: 600,
        },
      },
    },
    MuiTooltip: {
      styleOverrides: {
        tooltip: {
          borderRadius: 8,
          fontSize: '0.75rem',
        },
      },
    },
  },
});

export const lightTheme = createTheme(getDesignTokens('light'));
export const darkTheme = createTheme(getDesignTokens('dark'));

export default lightTheme;
