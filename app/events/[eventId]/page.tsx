'use client';

import React, { useEffect, useState, useCallback } from 'react';
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
  Divider,
} from '@mui/material';
import Grid from '@mui/material/Grid';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as TimeIcon,
  LocationOn as LocationIcon,
  Person as PersonIcon,
  Share as ShareIcon,
  CheckCircle as CheckCircleIcon,
} from '@mui/icons-material';
import { useAuth } from '@/context/auth/AuthContext';
import { events as eventApi, eventGuests as guestApi } from '@/lib/whisperrflow';
import { Event, EventGuest } from '@/types/whisperrflow';
import { format } from 'date-fns';
import { ID, Query } from 'appwrite';

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
        // Trigger auth overlay through context if possible, or force check session which might show overlay
        // In the current implementation, AuthContext handles overlay if checkSession fails/no user
        // But here we know they aren't authenticated.
        // We can manually call checkSession to trigger the flow if no user is found
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
      // Ideally show a snackbar here
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

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Skeleton variant="rectangular" height={300} sx={{ borderRadius: 3, mb: 4 }} />
        <Grid container spacing={4}>
          <Grid size={{ xs: 12, md: 8 }}>
            <Skeleton variant="text" height={60} width="80%" />
            <Skeleton variant="text" height={30} width="40%" />
            <Skeleton variant="text" height={200} sx={{ mt: 2 }} />
          </Grid>
          <Grid size={{ xs: 12, md: 4 }}>
            <Skeleton variant="rectangular" height={400} sx={{ borderRadius: 3 }} />
          </Grid>
        </Grid>
      </Container>
    );
  }

  if (error || !event) {
    return (
      <Container maxWidth="lg" sx={{ py: 8, textAlign: 'center' }}>
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

  return (
    <Box sx={{ minHeight: '100vh', pb: 8 }}>
      {/* Cover Image */}
      <Box
        sx={{
          height: { xs: 250, md: 400 },
          width: '100%',
          position: 'relative',
          backgroundImage: event.coverImageId
            ? `url(${event.coverImageId})` // Assuming this is a URL or processed ID
            : 'linear-gradient(135deg, #FFC700 0%, #FFCF40 100%)',
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          '&::after': {
            content: '""',
            position: 'absolute',
            bottom: 0,
            left: 0,
            right: 0,
            height: '50%',
            background: 'linear-gradient(to top, rgba(0,0,0,0.5), transparent)',
          },
        }}
      />

      <Container maxWidth="lg" sx={{ mt: -8, position: 'relative', zIndex: 1 }}>
        <Grid container spacing={4}>
          {/* Main Content */}
          <Grid size={{ xs: 12, md: 8 }}>
            <Paper sx={{ p: 4, mb: 4 }}>
              <Box sx={{ display: 'flex', gap: 1, mb: 2 }}>
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

              <Typography variant="h3" fontWeight={700} gutterBottom>
                {event.title}
              </Typography>

              <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, mb: 4, color: 'text.secondary' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <CalendarIcon fontSize="small" />
                  <Typography variant="body2">
                    {format(startDate, 'EEEE, MMMM d, yyyy')}
                  </Typography>
                </Box>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                  <TimeIcon fontSize="small" />
                  <Typography variant="body2">
                    {format(startDate, 'h:mm a')} - {format(endDate, 'h:mm a')}
                  </Typography>
                </Box>
              </Box>

              <Typography variant="h6" fontWeight={600} gutterBottom>
                About Event
              </Typography>
              <Typography variant="body1" color="text.secondary" paragraph sx={{ whiteSpace: 'pre-line' }}>
                {event.description || 'No description provided.'}
              </Typography>

              {/* Location */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h6" fontWeight={600} gutterBottom>
                  Location
                </Typography>
                <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1 }}>
                  <LocationIcon color="action" />
                  <Box>
                    <Typography variant="body1">
                      {event.location || 'Online Event'}
                    </Typography>
                    {event.meetingUrl && (
                      <Button
                        href={event.meetingUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        sx={{ mt: 1, p: 0, minWidth: 'auto' }}
                      >
                        Join Meeting
                      </Button>
                    )}
                  </Box>
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Sidebar */}
          <Grid size={{ xs: 12, md: 4 }}>
            <Paper sx={{ p: 3, position: 'sticky', top: 80 }}>
              <Typography variant="h6" fontWeight={600} gutterBottom>
                Registration
              </Typography>
              
              {isRegistered ? (
                <Box sx={{ textAlign: 'center', py: 2 }}>
                  <CheckCircleIcon color="success" sx={{ fontSize: 48, mb: 1 }} />
                  <Typography variant="h6" gutterBottom>
                    You&apos;re going!
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    A confirmation has been sent to your email.
                  </Typography>
                  <Button
                    variant="outlined"
                    color="error"
                    fullWidth
                    onClick={handleCancelRegistration}
                    disabled={registering}
                  >
                    {registering ? 'Processing...' : 'Cancel Registration'}
                  </Button>
                </Box>
              ) : (
                <Box>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                    Reserve your spot for this event.
                  </Typography>
                  <Button
                    variant="contained"
                    fullWidth
                    size="large"
                    onClick={handleRegister}
                    disabled={registering || event.status === 'cancelled'}
                  >
                    {registering ? 'Processing...' : isAuthenticated ? 'Register Now' : 'Sign in to Register'}
                  </Button>
                </Box>
              )}

              <Divider sx={{ my: 3 }} />

              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                <Typography variant="subtitle2" fontWeight={600}>
                  Attendees
                </Typography>
                <Typography variant="caption" color="text.secondary">
                  {event.maxAttendees ? `Max ${event.maxAttendees}` : 'Unlimited'}
                </Typography>
              </Box>
              
              <AvatarGroup max={4} sx={{ justifyContent: 'flex-end' }}>
                {/* Placeholders for now, would fetch real guests in a fuller implementation */}
                <Avatar />
                <Avatar />
                <Avatar />
              </AvatarGroup>

              <Button
                startIcon={<ShareIcon />}
                fullWidth
                variant="text"
                sx={{ mt: 2 }}
                onClick={() => {
                  navigator.clipboard.writeText(window.location.href);
                  // Could add toast here
                }}
              >
                Share Event
              </Button>
            </Paper>
          </Grid>
        </Grid>
      </Container>
    </Box>
  );
}

