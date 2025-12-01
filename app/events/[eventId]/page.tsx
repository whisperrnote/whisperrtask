'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Typography,
  Button,
  Avatar,
  AvatarGroup,
  Chip,
  Paper,
  Container,
  Skeleton,
  useTheme,
  Tooltip,
  alpha,
  Alert,
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  CheckCircle as CheckCircleIcon,
  ContentCopy as ContentCopyIcon,
  Lock as LockIcon,
  Public as PublicIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/auth/AuthContext';
import { events as eventApi, eventGuests as guestApi } from '@/lib/whisperrflow';
import { Event } from '@/types/whisperrflow';
import { format } from 'date-fns';
import { Query } from 'appwrite';
import { generateEventPattern } from '@/utils/patternGenerator';
import { eventPermissions } from '@/lib/permissions';

export default function EventPage() {
  const { eventId } = useParams<{ eventId: string }>();
  const theme = useTheme();
  const { user, isAuthenticated, checkSession } = useAuth();
  
  const [event, setEvent] = useState<Event | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isRegistered, setIsRegistered] = useState(false);
  const [guestId, setGuestId] = useState<string | null>(null);
  const [registering, setRegistering] = useState(false);
  const [shareTooltipOpen, setShareTooltipOpen] = useState(false);

  // Fetch event details
  useEffect(() => {
    const fetchEvent = async () => {
      try {
        setLoading(true);
        const eventData = await eventApi.get(eventId);
        setEvent(eventData);
      } catch (err) {
        console.error('Failed to fetch event:', err);
        setError('Event not found or failed to load.');
      } finally {
        setLoading(false);
      }
    };

    if (eventId) {
      fetchEvent();
    }
  }, [eventId]);

  // Check registration status if user is logged in
  useEffect(() => {
    const checkRegistration = async () => {
      if (!user || !eventId) return;

      try {
        const guests = await guestApi.list([
          Query.equal('eventId', eventId),
          Query.equal('userId', user.$id),
        ]);

        if (guests.total > 0) {
          setIsRegistered(true);
          setGuestId(guests.rows[0].$id);
        } else {
          setIsRegistered(false);
          setGuestId(null);
        }
      } catch (err) {
        console.error('Failed to check registration:', err);
      }
    };

    checkRegistration();
  }, [user, eventId]);

  const handleRegister = async () => {
    if (!isAuthenticated) {
        checkSession();
        return;
    }

    if (!user || !event) return;

    try {
      setRegistering(true);
      
      const newGuest = await guestApi.create({
        eventId: event.$id,
        userId: user.$id,
        email: user.email,
        status: 'accepted',
        role: 'attendee',
      });

      setIsRegistered(true);
      setGuestId(newGuest.$id);
    } catch (err) {
      console.error('Registration failed:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleCancelRegistration = async () => {
    if (!guestId) return;

    try {
      setRegistering(true);
      await guestApi.delete(guestId);
      setIsRegistered(false);
      setGuestId(null);
    } catch (err) {
      console.error('Cancellation failed:', err);
    } finally {
      setRegistering(false);
    }
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(window.location.href);
    setShareTooltipOpen(true);
    setTimeout(() => setShareTooltipOpen(false), 2000);
  };

  if (loading) {
    return (
      <Container maxWidth="md" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mb: 4 }} />
        <Skeleton variant="text" height={60} width="80%" />
        <Skeleton variant="text" height={30} width="40%" />
        <Skeleton variant="text" height={200} sx={{ mt: 2 }} />
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="md" sx={{ py: 8, textAlign: 'center' }}>
        <Typography variant="h4" gutterBottom>
          Oops!
        </Typography>
        <Typography color="text.secondary" sx={{ mb: 4 }}>
          {error || "We couldn't find that event."}
        </Typography>
        <Button variant="outlined" href="/events">
          Browse Events
        </Button>
      </Container>
    );
  }

  const startDate = new Date(event.startTime);
  const endDate = new Date(event.endTime);
  const coverStyle = event.coverImageId
    ? { backgroundImage: `url(${event.coverImageId})` }
    : { background: generateEventPattern(event.$id + event.title) };

  return (
    <Box sx={{ minHeight: '100%', pb: 8 }}>
      <Container maxWidth="md" sx={{ px: { xs: 0, sm: 2 } }}>
        <Paper
          sx={{
            overflow: 'hidden',
            borderRadius: { xs: 0, sm: 3 },
            boxShadow: theme.shadows[4],
            mb: 4,
          }}
        >
          {/* Cover Image / Pattern */}
          <Box
            sx={{
              height: { xs: 250, md: 350 },
              width: '100%',
              position: 'relative',
              backgroundSize: 'cover',
              backgroundPosition: 'center',
              ...coverStyle,
            }}
          >
            <Box
              sx={{
                position: 'absolute',
                top: 16,
                right: 16,
                display: 'flex',
                gap: 1,
              }}
            >
              <Tooltip
                title={shareTooltipOpen ? "Link copied!" : "Copy link"}
                open={shareTooltipOpen}
                onClose={() => setShareTooltipOpen(false)}
                arrow
              >
                <Button
                  variant="contained"
                  color="inherit"
                  size="small"
                  onClick={handleCopyLink}
                  sx={{
                    minWidth: 'auto',
                    p: 1,
                    backgroundColor: 'rgba(255,255,255,0.9)',
                    color: 'text.primary',
                    '&:hover': { backgroundColor: '#fff' },
                  }}
                >
                  <ContentCopyIcon fontSize="small" />
                </Button>
              </Tooltip>
            </Box>
          </Box>

          <Box sx={{ p: { xs: 3, md: 5 } }}>
            {/* Header */}
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 3 }}>
              <Box>
                <Typography variant="h3" fontWeight={800} gutterBottom sx={{ lineHeight: 1.2 }}>
                  {event.title}
                </Typography>
                <Box sx={{ display: 'flex', gap: 1, flexWrap: 'wrap', mb: 1 }}>
                  <Chip
                    label={event.visibility || 'Public'}
                    size="small"
                    color="primary"
                    variant="outlined"
                  />
                  {event.status === 'cancelled' && (
                    <Chip label="Cancelled" size="small" color="error" />
                  )}
                </Box>
              </Box>
            </Box>

            {/* Registration Area */}
            <Paper
              variant="outlined"
              sx={{
                p: 3,
                mb: 4,
                display: 'flex',
                flexDirection: { xs: 'column', sm: 'row' },
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: 2,
                backgroundColor: alpha(theme.palette.primary.main, 0.05),
                borderColor: alpha(theme.palette.primary.main, 0.2),
              }}
            >
              <Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                  <CalendarIcon color="primary" fontSize="small" />
                  <Typography variant="subtitle1" fontWeight={600}>
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <TimeIcon color="action" fontSize="small" />
                  <Typography variant="body2" color="text.secondary">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </Typography>
                </Box>
              </Box>

              <Box sx={{ width: { xs: '100%', sm: 'auto' } }}>
                {isRegistered ? (
                  <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: { xs: 'stretch', sm: 'flex-end' } }}>
                    <Chip
                      icon={<CheckCircleIcon />}
                      label="You're attending"
                      color="success"
                      sx={{ mb: 1, width: 'fit-content', alignSelf: { xs: 'center', sm: 'flex-end' } }}
                    />
                    <Button
                      variant="text"
                      color="error"
                      size="small"
                      onClick={handleCancelRegistration}
                      disabled={registering}
                    >
                      Cancel Registration
                    </Button>
                  </Box>
                ) : (
                  <Button
                    variant="contained"
                    size="large"
                    onClick={handleRegister}
                    disabled={registering || event.status === 'cancelled'}
                    fullWidth
                    sx={{ minWidth: 160 }}
                  >
                    {registering ? 'Processing...' : isAuthenticated ? 'Register' : 'Sign in to Register'}
                  </Button>
                )}
              </Box>
            </Paper>

            {/* Description */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                About
              </Typography>
              <Typography variant="body1" color="text.secondary" sx={{ whiteSpace: 'pre-line', lineHeight: 1.8 }}>
                {event.description || 'No description provided.'}
              </Typography>
            </Box>

            {/* Location */}
            <Box sx={{ mb: 4 }}>
              <Typography variant="h6" fontWeight={700} gutterBottom>
                Location
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5 }}>
                <Paper
                  sx={{
                    p: 1,
                    backgroundColor: alpha(theme.palette.action.active, 0.05),
                    borderRadius: 2,
                    boxShadow: 'none',
                  }}
                >
                  <LocationIcon color="action" />
                </Paper>
                <Box>
                  <Typography variant="subtitle1" fontWeight={600}>
                    {event.location || 'Online Event'}
                  </Typography>
                  {event.meetingUrl && (
                    <Button
                      href={event.meetingUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      variant="outlined"
                      size="small"
                      sx={{ mt: 1 }}
                    >
                      Join Meeting
                    </Button>
                  )}
                </Box>
              </Box>
            </Box>

            {/* Attendees */}
            <Box>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="h6" fontWeight={700}>
                  Attendees
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.maxAttendees ? `Limited to ${event.maxAttendees} spots` : 'Unlimited spots'}
                </Typography>
              </Box>
              <AvatarGroup max={6} sx={{ justifyContent: 'flex-start' }}>
                <Avatar />
                <Avatar />
                <Avatar />
                <Avatar />
              </AvatarGroup>
            </Box>
          </Box>
        </Paper>
      </Container>
    </Box>
  );
}
