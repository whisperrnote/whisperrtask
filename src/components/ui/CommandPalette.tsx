import { useState, useEffect, useRef, useCallback } from 'react'
import {
  Dialog,
  TextField,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Box,
  Typography,
  CircularProgress,
  Divider,
  useTheme,
} from '@mui/material'
import {
  Add as AddIcon,
  Search as SearchIcon,
  NavigateBefore as NavigateIcon,
  Settings as SettingsIcon,
  AccessTime as ClockIcon,
  ArrowForward as ArrowRightIcon,
} from '@mui/icons-material'
import { commandPaletteService } from '../../services/command-palette.service'
import type { Command as CommandType } from '../../services/command-palette.service'
import { useUIStore } from '../../store/uiStore'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const theme = useTheme()
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CommandType[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)
  const { setCommandPaletteOpen } = useUIStore()

  useEffect(() => {
    setHistory(commandPaletteService.getHistory())
  }, [])

  useEffect(() => {
    if (query) {
      const results = commandPaletteService.searchCommands(query)
      setSuggestions(results)
      setSelectedIndex(0)
    } else {
      setSuggestions(commandPaletteService.getFavorites())
      setSelectedIndex(0)
    }
  }, [query])

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex((i) => Math.min(i + 1, suggestions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex((i) => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            handleExecute(suggestions[selectedIndex])
          } else if (query) {
            handleExecute(null)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      inputRef.current?.focus()
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, selectedIndex, suggestions, query])

  const handleExecute = useCallback(
    async (command: CommandType | null) => {
      setIsExecuting(true)
      try {
        if (command) {
          await command.handler({ text: query })
        } else {
          await commandPaletteService.executeCommand(query)
        }
        onClose()
      } catch (error) {
        console.error('Command execution failed:', error)
      } finally {
        setIsExecuting(false)
      }
    },
    [query, onClose]
  )

  const getCommandIcon = (category: CommandType['category']) => {
    switch (category) {
      case 'task':
        return <AddIcon fontSize="small" />
      case 'navigation':
        return <NavigateIcon fontSize="small" />
      case 'search':
        return <SearchIcon fontSize="small" />
      case 'ecosystem':
        return <NavigateIcon fontSize="small" />
      case 'settings':
        return <SettingsIcon fontSize="small" />
      default:
        return <NavigateIcon fontSize="small" />
    }
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          mt: -4,
        },
      }}
    >
      <Box sx={{ p: 2 }}>
        <TextField
          ref={inputRef}
          fullWidth
          placeholder="Search or type a command..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          InputProps={{
            startAdornment: <SearchIcon sx={{ mr: 1, color: 'text.secondary' }} />,
          }}
          size="small"
          autoFocus
          sx={{ mb: 2 }}
        />

        <Box
          sx={{
            maxHeight: 350,
            overflow: 'auto',
          }}
        >
          {!query && history.length > 0 && (
            <>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, display: 'block', mb: 1 }}>
                Recent
              </Typography>
              {history.slice(0, 3).map((item, index) => (
                <ListItem
                  key={index}
                  button
                  onClick={() => setQuery(item)}
                  sx={{ cursor: 'pointer' }}
                >
                  <ListItemIcon>
                    <ClockIcon fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={item} />
                </ListItem>
              ))}
              <Divider sx={{ my: 1 }} />
            </>
          )}

          {suggestions.length > 0 ? (
            <>
              <Typography variant="caption" sx={{ color: 'text.secondary', px: 1, display: 'block', mb: 1 }}>
                {query ? 'Commands' : 'Favorites'}
              </Typography>
              <List sx={{ p: 0 }}>
                {suggestions.map((command, index) => (
                  <ListItem
                    key={command.id}
                    button
                    selected={index === selectedIndex}
                    onClick={() => handleExecute(command)}
                    sx={{
                      backgroundColor:
                        index === selectedIndex ? theme.palette.action.selected : 'transparent',
                    }}
                  >
                    <ListItemIcon>{getCommandIcon(command.category)}</ListItemIcon>
                    <ListItemText
                      primary={command.name}
                      secondary={command.description}
                      secondaryTypographyProps={{ noWrap: true }}
                    />
                    {command.shortcut && (
                      <Typography variant="caption" sx={{ color: 'text.secondary' }}>
                        {command.shortcut}
                      </Typography>
                    )}
                  </ListItem>
                ))}
              </List>
            </>
          ) : query ? (
            <Box sx={{ p: 2, textAlign: 'center' }}>
              <Typography variant="caption" sx={{ color: 'text.secondary', display: 'block', mb: 1 }}>
                Quick Actions
              </Typography>
              <Box
                sx={{
                  p: 2,
                  border: `1px dashed ${theme.palette.divider}`,
                  borderRadius: 1,
                  cursor: 'pointer',
                  '&:hover': { bgcolor: theme.palette.action.hover },
                }}
                onClick={() => handleExecute(null)}
              >
                <Typography variant="body2">Execute: {query}</Typography>
              </Box>
            </Box>
          ) : (
            <Box sx={{ p: 4, textAlign: 'center' }}>
              <Typography variant="body2" sx={{ color: 'text.secondary', mb: 1 }}>
                Type to search or create...
              </Typography>
              <Typography variant="caption" sx={{ color: 'text.disabled' }}>
                Try: "Create task", "Find notes", "Start meeting"
              </Typography>
            </Box>
          )}

          {isExecuting && (
            <Box
              sx={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                p: 2,
              }}
            >
              <CircularProgress size={24} />
            </Box>
          )}
        </Box>
      </Box>
    </Dialog>
  )
}
