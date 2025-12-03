'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Button,
  CircularProgress,
  IconButton,
  Paper,
  Stack,
  Dialog,
  DialogTitle,
  DialogContent,
  List,
  ListItem,
  ListItemButton,
  ListItemText,
  ListItemIcon,
  Checkbox,
  useTheme,
  Chip,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import {
  PlayArrow,
  Pause,
  Stop,
  Fullscreen,
  FullscreenExit,
  MusicNote,
  CheckCircle,
  RadioButtonUnchecked,
} from '@mui/icons-material';
import { useTask } from '@/context/TaskContext';
import { Task } from '@/types';
import { focusSessions } from '@/lib/whisperrflow';
import { useOriginFocus } from '@/hooks/useOriginFocus';

export default function FocusMode() {
  const theme = useTheme();
  const { tasks, updateTask, userId } = useTask();
  const [isActive, setIsActive] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const [timeLeft, setTimeLeft] = useState(25 * 60); // 25 minutes default
  const [initialTime, setInitialTime] = useState(25 * 60);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isTaskDialogOpen, setIsTaskDialogOpen] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

  // Origin Integration
  const { isAuthenticated, playlists, fetchPlaylists, loading: loadingPlaylists } = useOriginFocus();
  const [selectedPlaylist, setSelectedPlaylist] = useState<string>('');

  useEffect(() => {
    if (isAuthenticated) {
      fetchPlaylists();
    }
  }, [isAuthenticated]);

  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (isActive && !isPaused && timeLeft > 0) {
      interval = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (timeLeft === 0) {
      setIsActive(false);
      // Save completed session
         if (selectedTask) {
         const duration = Math.floor(initialTime / 60);
         focusSessions.create({
             startTime: new Date(Date.now() - initialTime * 1000).toISOString(),
             endTime: new Date().toISOString(),
             duration: duration,
             taskId: selectedTask.id,
             status: 'completed',
               userId: userId || 'guest',
               originSpotifyContext: selectedPlaylist || undefined,
         }).catch(console.error);
      }
    }

    return () => clearInterval(interval);
  }, [isActive, isPaused, timeLeft, selectedTask, initialTime]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const toggleTimer = () => {
    if (!isActive) {
      setIsActive(true);
      setIsPaused(false);
    } else {
      setIsPaused(!isPaused);
    }
  };

  const stopTimer = async () => {
    if (isActive && selectedTask) {
        // Save interrupted session
        const duration = Math.floor((initialTime - timeLeft) / 60);
        if (duration > 0) {
            try {
                await focusSessions.create({
                    startTime: new Date(Date.now() - (initialTime - timeLeft) * 1000).toISOString(),
                    endTime: new Date().toISOString(),
                    duration: duration,
                    taskId: selectedTask.id,
                    status: 'interrupted',
              userId: userId || 'guest',
              originSpotifyContext: selectedPlaylist || undefined,
                });
            } catch (e) {
                console.error('Failed to save focus session', e);
            }
        }
    }
    setIsActive(false);
    setIsPaused(false);
    setTimeLeft(initialTime);
  };

  const handleTaskSelect = (task: Task) => {
    setSelectedTask(task);
    setIsTaskDialogOpen(false);
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
        setIsFullscreen(false);
      }
    }
  };

  const progress = ((initialTime - timeLeft) / initialTime) * 100;

  // Preset durations
  const presets = [
    { label: '15m', value: 15 * 60 },
    { label: '25m', value: 25 * 60 },
    { label: '45m', value: 45 * 60 },
    { label: '60m', value: 60 * 60 },
  ];

  return (
    <Box
      sx={{
        height: '100%',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        p: 3,
        position: 'relative',
        background: isActive && !isPaused 
          ? `radial-gradient(circle at center, ${theme.palette.primary.main}08 0%, transparent 70%)`
          : 'transparent',
        transition: 'background 0.5s ease',
      }}
    >
      <Box sx={{ position: 'absolute', top: 16, right: 16, display: 'flex', gap: 1 }}>
        <IconButton 
          onClick={toggleFullscreen}
          sx={{ 
            bgcolor: theme.palette.action.hover,
            '&:hover': { bgcolor: theme.palette.action.selected },
          }}
        >
          {isFullscreen ? <FullscreenExit /> : <Fullscreen />}
        </IconButton>
      </Box>

      <Box sx={{ mb: 4, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom fontWeight="bold">
          Focus Mode
        </Typography>
        <Typography variant="body1" color="text.secondary">
          {isActive ? (isPaused ? 'Take a breath...' : 'Deep work in progress') : 'Ready to focus?'}
        </Typography>
      </Box>

      {/* Timer Circle */}
      <Box sx={{ position: 'relative', display: 'inline-flex', mb: 4 }}>
        {/* Outer glow when active */}
        {isActive && !isPaused && (
          <Box
            sx={{
              position: 'absolute',
              inset: -20,
              borderRadius: '50%',
              background: `radial-gradient(circle, ${theme.palette.primary.main}20 0%, transparent 70%)`,
              animation: 'pulse 3s ease-in-out infinite',
            }}
          />
        )}
        <CircularProgress
          variant="determinate"
          value={100}
          size={280}
          thickness={3}
          sx={{ color: theme.palette.divider }}
        />
        <CircularProgress
          variant="determinate"
          value={progress}
          size={280}
          thickness={3}
          sx={{
            color: isActive && !isPaused ? theme.palette.primary.main : theme.palette.grey[400],
            position: 'absolute',
            left: 0,
            strokeLinecap: 'round',
            transition: 'color 0.3s ease',
            filter: isActive && !isPaused ? `drop-shadow(0 0 8px ${theme.palette.primary.main}60)` : 'none',
          }}
        />
        <Box
          sx={{
            top: 0,
            left: 0,
            bottom: 0,
            right: 0,
            position: 'absolute',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flexDirection: 'column',
          }}
        >
          <Typography 
            variant="h1" 
            component="div" 
            fontWeight="700" 
            sx={{ 
              fontSize: { xs: '3.5rem', sm: '4.5rem' },
              fontVariantNumeric: 'tabular-nums',
              letterSpacing: '-0.02em',
            }}
          >
            {formatTime(timeLeft)}
          </Typography>
          <Chip
            label={isActive ? (isPaused ? 'PAUSED' : 'FOCUSING') : 'READY'}
            size="small"
            color={isActive && !isPaused ? 'primary' : 'default'}
            sx={{ 
              mt: 1,
              fontWeight: 600,
              letterSpacing: '0.05em',
            }}
          />
        </Box>
      </Box>

      {/* Duration Presets - only show when not active */}
      {!isActive && (
        <Stack direction="row" spacing={1} sx={{ mb: 4 }}>
          {presets.map((preset) => (
            <Button
              key={preset.label}
              variant={initialTime === preset.value ? 'contained' : 'outlined'}
              size="small"
              onClick={() => {
                setInitialTime(preset.value);
                setTimeLeft(preset.value);
              }}
              sx={{ 
                minWidth: 56,
                borderRadius: 2,
              }}
            >
              {preset.label}
            </Button>
          ))}
        </Stack>
      )}

      {/* Origin Spotify Integration */}
      {isAuthenticated && (
        <Box sx={{ mb: 4, width: '100%', maxWidth: 500 }}>
          <FormControl fullWidth size="small">
            <InputLabel>Focus Music (Spotify)</InputLabel>
            <Select
              value={selectedPlaylist}
              label="Focus Music (Spotify)"
              onChange={(e) => setSelectedPlaylist(e.target.value)}
              disabled={loadingPlaylists}
            >
              <MenuItem value="">
                <em>None</em>
              </MenuItem>
              {playlists.map((playlist: any) => (
                <MenuItem key={playlist.id} value={playlist.id}>
                  {playlist.name}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
        </Box>
      )}

      {/* Selected Task */}
      <Box sx={{ mb: 4, width: '100%', maxWidth: 500 }}>
        {selectedTask ? (
          <Paper
            elevation={0}
            sx={{
              p: 2,
              border: `1px solid ${theme.palette.divider}`,
              borderRadius: 2,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              cursor: 'pointer',
            }}
            onClick={() => setIsTaskDialogOpen(true)}
          >
            <Box>
              <Typography variant="caption" color="text.secondary" display="block" gutterBottom>
                WORKING ON
              </Typography>
              <Typography variant="h6">{selectedTask.title}</Typography>
            </Box>
            <IconButton
              color={selectedTask.status === 'done' ? 'success' : 'default'}
              onClick={(e) => {
                e.stopPropagation();
                updateTask(selectedTask.id, {
                  status: selectedTask.status === 'done' ? 'todo' : 'done',
                });
              }}
            >
              {selectedTask.status === 'done' ? <CheckCircle /> : <RadioButtonUnchecked />}
            </IconButton>
          </Paper>
        ) : (
          <Button
            variant="outlined"
            fullWidth
            size="large"
            onClick={() => setIsTaskDialogOpen(true)}
            sx={{ borderStyle: 'dashed', height: 80 }}
          >
            Select a task to focus on
          </Button>
        )}
      </Box>

      {/* Controls */}
      <Stack direction="row" spacing={2}>
        <Button
          variant="contained"
          color="primary"
          size="large"
          startIcon={isActive && !isPaused ? <Pause /> : <PlayArrow />}
          onClick={toggleTimer}
          sx={{ px: 4, py: 1.5, borderRadius: 50, fontSize: '1.2rem' }}
        >
          {isActive && !isPaused ? 'Pause' : isActive ? 'Resume' : 'Start Focus'}
        </Button>
        {isActive && (
          <Button
            variant="outlined"
            color="error"
            size="large"
            startIcon={<Stop />}
            onClick={stopTimer}
            sx={{ px: 4, py: 1.5, borderRadius: 50 }}
          >
            Stop
          </Button>
        )}
      </Stack>

      {/* Task Selection Dialog */}
      <Dialog
        open={isTaskDialogOpen}
        onClose={() => setIsTaskDialogOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Select a Task</DialogTitle>
        <DialogContent>
          <List>
            {tasks
              .filter((t) => t.status !== 'done')
              .map((task) => (
                <ListItem key={task.id} disablePadding>
                  <ListItemButton
                    onClick={() => handleTaskSelect(task)}
                    selected={selectedTask?.id === task.id}
                  >
                    <ListItemIcon>
                      <RadioButtonUnchecked />
                    </ListItemIcon>
                    <ListItemText
                      primary={task.title}
                      secondary={task.description}
                      primaryTypographyProps={{
                        variant: 'body1',
                        fontWeight: selectedTask?.id === task.id ? 'bold' : 'normal',
                      }}
                    />
                    {task.priority === 'high' && (
                      <Chip label="High" color="error" size="small" sx={{ ml: 1 }} />
                    )}
                  </ListItemButton>
                </ListItem>
              ))}
          </List>
        </DialogContent>
      </Dialog>
    </Box>
  );
}
