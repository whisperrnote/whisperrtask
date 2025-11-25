'use client';

import React, { useState } from 'react';
import {
  Drawer,
  Box,
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  Typography,
  Collapse,
  IconButton,
  Badge,
  Tooltip,
  Divider,
  LinearProgress,
  useTheme,
  alpha,
} from '@mui/material';
import {
  Inbox as InboxIcon,
  Today as TodayIcon,
  CalendarMonth as CalendarIcon,
  Schedule as ScheduleIcon,
  CheckCircle as CompletedIcon,
  Label as LabelIcon,
  Folder as FolderIcon,
  FolderOpen as FolderOpenIcon,
  Add as AddIcon,
  ExpandLess,
  ExpandMore,
  Star as StarIcon,
  StarBorder as StarBorderIcon,
  ViewKanban as KanbanIcon,
  GridView as MatrixIcon,
  Timeline as TimelineIcon,
  FilterList as FilterIcon,
  MoreHoriz as MoreIcon,
  Settings as SettingsIcon,
  Archive as ArchiveIcon,
} from '@mui/icons-material';
import { useTask } from '@/app/context/TaskContext';

const DRAWER_WIDTH = 280;

interface NavItem {
  id: string;
  label: string;
  icon: React.ReactNode;
  badge?: number;
  color?: string;
}

export default function Sidebar() {
  const theme = useTheme();
  const {
    sidebarOpen,
    projects,
    labels,
    tasks,
    selectedProjectId,
    selectProject,
    setFilter,
    filter,
    updateProject,
  } = useTask();

  const [projectsOpen, setProjectsOpen] = useState(true);
  const [labelsOpen, setLabelsOpen] = useState(true);

  // Calculate stats
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const tomorrow = new Date(today);
  tomorrow.setDate(tomorrow.getDate() + 1);
  const nextWeek = new Date(today);
  nextWeek.setDate(nextWeek.getDate() + 7);

  const inboxCount = tasks.filter(
    (t) => t.projectId === 'inbox' && t.status !== 'done' && !t.isArchived
  ).length;

  const todayCount = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done' || t.isArchived) return false;
    const due = new Date(t.dueDate);
    return due >= today && due < tomorrow;
  }).length;

  const upcomingCount = tasks.filter((t) => {
    if (!t.dueDate || t.status === 'done' || t.isArchived) return false;
    const due = new Date(t.dueDate);
    return due >= tomorrow && due < nextWeek;
  }).length;

  const overdueCount = tasks.filter(
    (t) => t.dueDate && new Date(t.dueDate) < now && t.status !== 'done' && !t.isArchived
  ).length;

  const completedCount = tasks.filter(
    (t) => t.status === 'done' && !t.isArchived
  ).length;

  const smartLists: NavItem[] = [
    { id: 'inbox', label: 'Inbox', icon: <InboxIcon />, badge: inboxCount },
    { id: 'today', label: 'Today', icon: <TodayIcon />, badge: todayCount, color: '#10b981' },
    { id: 'upcoming', label: 'Upcoming', icon: <ScheduleIcon />, badge: upcomingCount, color: '#3b82f6' },
    {
      id: 'overdue',
      label: 'Overdue',
      icon: <CalendarIcon />,
      badge: overdueCount,
      color: '#ef4444',
    },
    { id: 'completed', label: 'Completed', icon: <CompletedIcon />, badge: completedCount },
  ];

  const viewModes: NavItem[] = [
    { id: 'board', label: 'Board View', icon: <KanbanIcon /> },
    { id: 'calendar', label: 'Calendar View', icon: <CalendarIcon /> },
    { id: 'timeline', label: 'Timeline', icon: <TimelineIcon /> },
    { id: 'matrix', label: 'Priority Matrix', icon: <MatrixIcon /> },
  ];

  const handleSmartListClick = (id: string) => {
    switch (id) {
      case 'inbox':
        selectProject('inbox');
        setFilter({ ...filter, projectId: 'inbox' });
        break;
      case 'today':
        selectProject(null);
        setFilter({
          ...filter,
          projectId: undefined,
          dueDate: { from: today, to: tomorrow },
          showCompleted: false,
        });
        break;
      case 'upcoming':
        selectProject(null);
        setFilter({
          ...filter,
          projectId: undefined,
          dueDate: { from: tomorrow, to: nextWeek },
          showCompleted: false,
        });
        break;
      case 'overdue':
        selectProject(null);
        setFilter({
          ...filter,
          projectId: undefined,
          dueDate: { to: now },
          showCompleted: false,
        });
        break;
      case 'completed':
        selectProject(null);
        setFilter({
          ...filter,
          projectId: undefined,
          status: ['done'],
          showCompleted: true,
        });
        break;
    }
  };

  const handleProjectClick = (projectId: string) => {
    selectProject(projectId);
    setFilter({ ...filter, projectId, status: undefined, dueDate: undefined });
  };

  const toggleFavorite = (projectId: string, isFavorite: boolean) => {
    updateProject(projectId, { isFavorite: !isFavorite });
  };

  const getProjectTaskCount = (projectId: string) => {
    return tasks.filter(
      (t) => t.projectId === projectId && t.status !== 'done' && !t.isArchived
    ).length;
  };

  const getProjectProgress = (projectId: string) => {
    const projectTasks = tasks.filter((t) => t.projectId === projectId && !t.isArchived);
    if (projectTasks.length === 0) return 0;
    const completed = projectTasks.filter((t) => t.status === 'done').length;
    return (completed / projectTasks.length) * 100;
  };

  const favoriteProjects = projects.filter((p) => p.isFavorite && !p.isArchived);
  const regularProjects = projects.filter((p) => !p.isFavorite && !p.isArchived && p.id !== 'inbox');

  return (
    <Drawer
      variant="persistent"
      anchor="left"
      open={sidebarOpen}
      sx={{
        width: sidebarOpen ? DRAWER_WIDTH : 0,
        flexShrink: 0,
        '& .MuiDrawer-paper': {
          width: DRAWER_WIDTH,
          boxSizing: 'border-box',
          borderRight: `1px solid ${theme.palette.divider}`,
          backgroundColor: theme.palette.background.default,
          mt: '64px',
          height: 'calc(100% - 64px)',
        },
      }}
    >
      <Box sx={{ overflow: 'auto', py: 1 }}>
        {/* Smart Lists */}
        <List dense>
          {smartLists.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                selected={filter.projectId === item.id || (item.id === 'completed' && filter.status?.includes('done'))}
                onClick={() => handleSmartListClick(item.id)}
                sx={{
                  borderRadius: 2,
                  mx: 1,
                  '&.Mui-selected': {
                    backgroundColor: alpha(theme.palette.primary.main, 0.12),
                  },
                }}
              >
                <ListItemIcon
                  sx={{
                    minWidth: 36,
                    color: item.color || theme.palette.text.secondary,
                  }}
                >
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
                {item.badge !== undefined && item.badge > 0 && (
                  <Badge
                    badgeContent={item.badge}
                    color={item.id === 'overdue' ? 'error' : 'default'}
                    sx={{
                      '& .MuiBadge-badge': {
                        backgroundColor:
                          item.id === 'overdue'
                            ? theme.palette.error.main
                            : alpha(theme.palette.text.primary, 0.2),
                        color: item.id === 'overdue' ? '#fff' : theme.palette.text.primary,
                      },
                    }}
                  />
                )}
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* View Modes */}
        <Typography
          variant="overline"
          sx={{ px: 2, color: 'text.secondary', display: 'block', mt: 1 }}
        >
          Views
        </Typography>
        <List dense>
          {viewModes.map((item) => (
            <ListItem key={item.id} disablePadding>
              <ListItemButton
                sx={{
                  borderRadius: 2,
                  mx: 1,
                }}
              >
                <ListItemIcon sx={{ minWidth: 36, color: theme.palette.text.secondary }}>
                  {item.icon}
                </ListItemIcon>
                <ListItemText primary={item.label} />
              </ListItemButton>
            </ListItem>
          ))}
        </List>

        <Divider sx={{ my: 1 }} />

        {/* Favorite Projects */}
        {favoriteProjects.length > 0 && (
          <>
            <Typography
              variant="overline"
              sx={{ px: 2, color: 'text.secondary', display: 'block', mt: 1 }}
            >
              Favorites
            </Typography>
            <List dense>
              {favoriteProjects.map((project) => (
                <ListItem key={project.id} disablePadding>
                  <ListItemButton
                    selected={selectedProjectId === project.id}
                    onClick={() => handleProjectClick(project.id)}
                    sx={{
                      borderRadius: 2,
                      mx: 1,
                      '&.Mui-selected': {
                        backgroundColor: alpha(theme.palette.primary.main, 0.12),
                      },
                    }}
                  >
                    <ListItemIcon sx={{ minWidth: 36 }}>
                      <Box
                        sx={{
                          width: 12,
                          height: 12,
                          borderRadius: '50%',
                          backgroundColor: project.color,
                        }}
                      />
                    </ListItemIcon>
                    <ListItemText primary={project.name} />
                    <IconButton
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(project.id, project.isFavorite);
                      }}
                      sx={{ color: theme.palette.warning.main }}
                    >
                      <StarIcon fontSize="small" />
                    </IconButton>
                  </ListItemButton>
                </ListItem>
              ))}
            </List>
            <Divider sx={{ my: 1 }} />
          </>
        )}

        {/* Projects */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', flexGrow: 1, cursor: 'pointer' }}
            onClick={() => setProjectsOpen(!projectsOpen)}
          >
            Projects
          </Typography>
          <IconButton size="small" onClick={() => setProjectsOpen(!projectsOpen)}>
            {projectsOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
          <Tooltip title="Add project">
            <IconButton size="small">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={projectsOpen}>
          <List dense>
            {regularProjects.map((project) => (
              <ListItem key={project.id} disablePadding>
                <ListItemButton
                  selected={selectedProjectId === project.id}
                  onClick={() => handleProjectClick(project.id)}
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    '&.Mui-selected': {
                      backgroundColor: alpha(theme.palette.primary.main, 0.12),
                    },
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <Box
                      sx={{
                        width: 12,
                        height: 12,
                        borderRadius: '50%',
                        backgroundColor: project.color,
                      }}
                    />
                  </ListItemIcon>
                  <ListItemText
                    primary={project.name}
                    secondary={
                      <LinearProgress
                        variant="determinate"
                        value={getProjectProgress(project.id)}
                        sx={{
                          mt: 0.5,
                          height: 4,
                          borderRadius: 2,
                          backgroundColor: alpha(project.color, 0.2),
                          '& .MuiLinearProgress-bar': {
                            backgroundColor: project.color,
                          },
                        }}
                      />
                    }
                  />
                  <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                    {getProjectTaskCount(project.id)}
                  </Typography>
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        <Divider sx={{ my: 1 }} />

        {/* Labels */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            px: 2,
            py: 0.5,
          }}
        >
          <Typography
            variant="overline"
            sx={{ color: 'text.secondary', flexGrow: 1, cursor: 'pointer' }}
            onClick={() => setLabelsOpen(!labelsOpen)}
          >
            Labels
          </Typography>
          <IconButton size="small" onClick={() => setLabelsOpen(!labelsOpen)}>
            {labelsOpen ? <ExpandLess fontSize="small" /> : <ExpandMore fontSize="small" />}
          </IconButton>
          <Tooltip title="Add label">
            <IconButton size="small">
              <AddIcon fontSize="small" />
            </IconButton>
          </Tooltip>
        </Box>

        <Collapse in={labelsOpen}>
          <List dense>
            {labels.map((label) => (
              <ListItem key={label.id} disablePadding>
                <ListItemButton
                  onClick={() =>
                    setFilter({
                      ...filter,
                      labels: filter.labels?.includes(label.id)
                        ? filter.labels.filter((l) => l !== label.id)
                        : [...(filter.labels || []), label.id],
                    })
                  }
                  sx={{
                    borderRadius: 2,
                    mx: 1,
                    backgroundColor: filter.labels?.includes(label.id)
                      ? alpha(label.color, 0.12)
                      : 'transparent',
                  }}
                >
                  <ListItemIcon sx={{ minWidth: 36 }}>
                    <LabelIcon sx={{ color: label.color }} fontSize="small" />
                  </ListItemIcon>
                  <ListItemText primary={label.name} />
                </ListItemButton>
              </ListItem>
            ))}
          </List>
        </Collapse>

        {/* Bottom Actions */}
        <Box sx={{ mt: 'auto', pt: 2 }}>
          <Divider />
          <List dense>
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 2, mx: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <ArchiveIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Archived" />
              </ListItemButton>
            </ListItem>
            <ListItem disablePadding>
              <ListItemButton sx={{ borderRadius: 2, mx: 1 }}>
                <ListItemIcon sx={{ minWidth: 36 }}>
                  <SettingsIcon fontSize="small" />
                </ListItemIcon>
                <ListItemText primary="Settings" />
              </ListItemButton>
            </ListItem>
          </List>
        </Box>
      </Box>
    </Drawer>
  );
}
