'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Grid,
  Button,
  Tabs,
  Tab,
  useTheme,
  useMediaQuery,
  CircularProgress,
} from '@mui/material';
import { Add, CalendarMonth, List as ListIcon } from '@mui/icons-material';
import EventCard from './EventCard';
import EventDialog from './EventDialog';
import { Event } from '@/types';
import { addDays, addHours } from 'date-fns';
import { events as eventApi } from '@/lib/whisperrflow';
import { useTask } from '@/context/TaskContext';

export default function EventList() {
  const theme = useTheme();
  const isMobile = useMediaQuery(theme.breakpoints.down('sm'));
  const [tabValue, setTabValue] = useState(0);
  const [events, setEvents] = useState<Event[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const { projects } = useTask();

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        setIsLoading(true);
        const list = await eventApi.list();
        const mapped = list.rows.map(doc => ({
          id: doc.$id,
          title: doc.title,
          description: doc.description,
          startTime: new Date(doc.startTime),
          endTime: new Date(doc.endTime),
          location: doc.location,
          url: '',
          coverImage: '',
          attendees: [],
          isPublic: false,
          creatorId: '',
          createdAt: new Date(doc.$createdAt),
          updatedAt: new Date(doc.$updatedAt),
        }));
        setEvents(mapped);
      } catch (error) {
        console.error('Failed to fetch events', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchEvents();
  }, []);

  const handleCreateEvent = async (eventData: any) => {
    try {
      // Use first project as calendar or default
      // In a real app, user should select a calendar
      const calendarId = projects[0]?.id || 'default';
      
      const newDoc = await eventApi.create({
        title: eventData.title,
        description: eventData.description || '',
        startTime: eventData.startTime.toISOString(),
        endTime: eventData.endTime.toISOString(),
        location: eventData.location || '',
        calendarId: calendarId,
      });

      const newEvent: Event = {
        id: newDoc.$id,
        title: newDoc.title,
        description: newDoc.description,
        startTime: new Date(newDoc.startTime),
        endTime: new Date(newDoc.endTime),
        location: newDoc.location,
        url: '',
        coverImage: '',
        attendees: [],
        isPublic: false,
        creatorId: '',
        createdAt: new Date(newDoc.$createdAt),
        updatedAt: new Date(newDoc.$updatedAt),
      };

      setEvents([newEvent, ...events]);
      setIsDialogOpen(false);
    } catch (error) {
      console.error('Failed to create event', error);
    }
  };

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box sx={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          mb: 3,
          flexWrap: 'wrap',
          gap: 2,
        }}
      >
        <Box>
          <Typography variant="h4" fontWeight="bold">
            Events
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Discover and manage your schedule
          </Typography>
        </Box>
        <Button
          variant="contained"
          startIcon={<Add />}
          sx={{ borderRadius: 50, px: 3 }}
          onClick={() => setIsDialogOpen(true)}
        >
          Create Event
        </Button>
      </Box>

      <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
        <Tabs value={tabValue} onChange={handleTabChange} aria-label="event tabs">
          <Tab label="Upcoming" />
          <Tab label="Past" />
          <Tab label="My Events" />
        </Tabs>
      </Box>

      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid size={{ xs: 12, sm: 6, md: 4, lg: 3 }} key={event.id}>
            <EventCard event={event} onClick={() => console.log('Clicked event', event.id)} />
          </Grid>
        ))}
      </Grid>

      <EventDialog
        open={isDialogOpen}
        onClose={() => setIsDialogOpen(false)}
        onSubmit={handleCreateEvent}
      />
    </Box>
  );
}
