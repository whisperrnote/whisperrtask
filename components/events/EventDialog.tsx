'use client';

import React, { useState } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Button,
  Box,
  IconButton,
  Typography,
  Divider,
  useTheme,
  InputAdornment,
  ToggleButtonGroup,
  ToggleButton,
  Tooltip,
  alpha,
} from '@mui/material';
import {
  X as CloseIcon,
  MapPin as LocationOn,
  Link as LinkIcon,
  Image as ImageIcon,
  Globe as PublicIcon,
  Lock as PrivateIcon,
  Link2Off as UnlistedIcon,
} from 'lucide-react';
import { DateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDateFns } from '@mui/x-date-pickers/AdapterDateFns';
import { addHours } from 'date-fns';
import { EventVisibility } from '@/lib/permissions';

interface EventDialogProps {
  open: boolean;
  onClose: () => void;
  onSubmit: (eventData: any) => void;
}

export default function EventDialog({ open, onClose, onSubmit }: EventDialogProps) {
  const theme = useTheme();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startTime, setStartTime] = useState<Date | null>(new Date());
  const [endTime, setEndTime] = useState<Date | null>(addHours(new Date(), 1));
  const [location, setLocation] = useState('');
  const [url, setUrl] = useState('');
  const [coverImage, setCoverImage] = useState('');
  const [visibility, setVisibility] = useState<EventVisibility>('public');

  const handleSubmit = () => {
    if (!title.trim() || !startTime || !endTime) return;

    onSubmit({
      title,
      description,
      startTime,
      endTime,
      location,
      url,
      coverImage,
      visibility,
    });

    resetForm();
  };

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setStartTime(new Date());
    setEndTime(addHours(new Date(), 1));
    setLocation('');
    setUrl('');
    setCoverImage('');
    setVisibility('public');
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDateFns}>
      <Dialog
        open={open}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: 3,
          },
        }}
      >
        <DialogTitle
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            pb: 1,
          }}
        >
          <Typography variant="h6" fontWeight={600}>
            Create New Event
          </Typography>
          <IconButton onClick={handleClose} size="small">
            <CloseIcon size={20} />
          </IconButton>
        </DialogTitle>

        <Divider />

        <DialogContent sx={{ pt: 2 }}>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2.5 }}>
            {/* Title */}
            <TextField
              autoFocus
              label="Event title"
              placeholder="Event Name"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              fullWidth
              required
              InputProps={{
                sx: { fontSize: '1.1rem' },
              }}
            />

            {/* Description */}
            <TextField
              label="Description"
              placeholder="Add details..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              fullWidth
              multiline
              rows={3}
            />

            {/* Date Time Row */}
            <Box sx={{ display: 'flex', gap: 2 }}>
              <DateTimePicker
                label="Start Time"
                value={startTime}
                onChange={(newValue) => setStartTime(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
              <DateTimePicker
                label="End Time"
                value={endTime}
                onChange={(newValue) => setEndTime(newValue)}
                slotProps={{ textField: { fullWidth: true } }}
              />
            </Box>

            {/* Location */}
            <TextField
              label="Location"
              placeholder="Add location or link"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LocationOn color={theme.palette.action.active} size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* URL */}
            <TextField
              label="Event Link"
              placeholder="https://..."
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <LinkIcon color={theme.palette.action.active} size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Cover Image URL */}
            <TextField
              label="Cover Image URL"
              placeholder="https://..."
              value={coverImage}
              onChange={(e) => setCoverImage(e.target.value)}
              fullWidth
              InputProps={{
                startAdornment: (
                  <InputAdornment position="start">
                    <ImageIcon color={theme.palette.action.active} size={20} />
                  </InputAdornment>
                ),
              }}
            />

            {/* Visibility */}
            <Box>
              <Typography variant="subtitle2" color="text.secondary" gutterBottom>
                Event Visibility
              </Typography>
              <ToggleButtonGroup
                value={visibility}
                exclusive
                onChange={(_, value) => value && setVisibility(value)}
                fullWidth
                sx={{
                  '& .MuiToggleButton-root': {
                    py: 1.5,
                    flex: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.1),
                      borderColor: theme.palette.primary.main,
                      '&:hover': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.15),
                      },
                    },
                  },
                }}
              >
                <ToggleButton value="public">
                  <Tooltip title="Anyone can discover and view this event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PublicIcon size={18} />
                      <Typography variant="body2">Public</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="unlisted">
                  <Tooltip title="Only people with the link can view">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <UnlistedIcon size={18} />
                      <Typography variant="body2">Unlisted</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
                <ToggleButton value="private">
                  <Tooltip title="Only you can view this event">
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <PrivateIcon size={18} />
                      <Typography variant="body2">Private</Typography>
                    </Box>
                  </Tooltip>
                </ToggleButton>
              </ToggleButtonGroup>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>
                {visibility === 'public' && 'This event will be visible to everyone and can be discovered.'}
                {visibility === 'unlisted' && 'Only people with the direct link can view this event.'}
                {visibility === 'private' && 'Only you can see this event. Others cannot access it.'}
              </Typography>
            </Box>
          </Box>
        </DialogContent>

        <Divider />

        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button onClick={handleClose} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            variant="contained"
            disabled={!title.trim() || !startTime || !endTime}
          >
            Create Event
          </Button>
        </DialogActions>
      </Dialog>
    </LocalizationProvider>
  );
}
