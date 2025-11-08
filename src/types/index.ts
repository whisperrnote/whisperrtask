export interface User {
  id: string
  email: string
  name: string
  avatar?: string
}

export interface Workspace {
  id: string
  name: string
  description?: string
  ownerId: string
  createdAt: Date
  updatedAt: Date
}

export interface Project {
  id: string
  workspaceId: string
  name: string
  description?: string
  status: 'active' | 'archived' | 'completed'
  createdAt: Date
  updatedAt: Date
}

export interface Task {
  id: string
  projectId: string
  parentTaskId?: string
  title: string
  description?: string
  status: 'todo' | 'in_progress' | 'blocked' | 'completed'
  assigneeIds: string[]
  dueDate?: Date
  valueScore?: number
  effortScore?: number
  contextLinks: ContextLink[]
  createdAt: Date
  updatedAt: Date
  createdBy: string
}

export interface Subtask {
  id: string
  taskId: string
  title: string
  completed: boolean
  createdAt: Date
}

export interface Comment {
  id: string
  taskId: string
  userId: string
  content: string
  mentions: string[]
  createdAt: Date
  updatedAt: Date
}

export interface ContextLink {
  id: string
  type: 'note' | 'meeting' | 'credential' | 'external'
  sourceApp: 'whisperrnote' | 'whisperrmeet' | 'whisperrpass' | 'external'
  resourceId: string
  title: string
  snippet?: string
  timestamp?: number
  url?: string
}

export interface Notification {
  id: string
  userId: string
  type: 'task_assigned' | 'task_completed' | 'task_commented' | 'task_due_soon' | 'meeting_action_item' | 'note_task_created'
  sourceApp: 'whisperrtask' | 'whisperrnote' | 'whisperrmeet' | 'whisperrpass'
  resourceId: string
  title: string
  message: string
  actionable: boolean
  read: boolean
  createdAt: Date
}

export interface AIContext {
  taskId: string
  relatedNotes: ContextLink[]
  relatedMeetings: ContextLink[]
  relatedCredentials: ContextLink[]
  suggestions: AISuggestion[]
}

export interface AISuggestion {
  id: string
  type: 'bottleneck' | 'priority' | 'context' | 'resource'
  message: string
  actionable: boolean
  action?: string
}

export type TaskView = 'list' | 'board' | 'calendar'

export interface TaskFilters {
  status?: Task['status'][]
  assigneeIds?: string[]
  projectId?: string
  dueDateRange?: { start: Date; end: Date }
  valueScoreMin?: number
  effortScoreMax?: number
}
