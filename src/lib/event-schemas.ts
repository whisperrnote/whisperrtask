export interface WhisperrNoteTaskPayload {
  noteId: string
  noteTitle: string
  checkboxText: string
  checkboxIndex: number
  noteSnippet: string
  noteUrl: string
}

export interface WhisperrMeetActionItemPayload {
  meetingId: string
  meetingTitle: string
  transcript: string
  actionItem: string
  speaker: string
  timestamp: number
  audioUrl?: string
  participants: Array<{
    id: string
    name: string
    email: string
  }>
}

export interface WhisperrPassCredentialPayload {
  credentialId: string
  credentialName: string
  service: string
  metadata: Record<string, any>
}

export interface TaskStatusChangePayload {
  taskId: string
  oldStatus: string
  newStatus: string
  completedBy?: string
  completedAt?: number
}

export interface TaskAssignedPayload {
  taskId: string
  taskTitle: string
  assigneeId: string
  assigneeName: string
  assignedBy: string
  dueDate?: number
}

export const EVENT_TYPES = {
  // WhisperrNote events
  NOTE_TASK_CREATED: 'whisperrnote.task.created',
  NOTE_TASK_CHECKED: 'whisperrnote.task.checked',
  NOTE_TASK_UNCHECKED: 'whisperrnote.task.unchecked',
  NOTE_UPDATED: 'whisperrnote.note.updated',
  NOTE_DELETED: 'whisperrnote.note.deleted',

  // WhisperrMeet events
  MEET_ACTION_ITEM_DETECTED: 'whisperrmeet.actionitem.detected',
  MEET_COMPLETED: 'whisperrmeet.meeting.completed',
  MEET_PARTICIPANT_COMMITTED: 'whisperrmeet.participant.committed',

  // WhisperrPass events
  PASS_CREDENTIAL_REQUESTED: 'whisperrpass.credential.requested',
  PASS_CREDENTIAL_APPROVED: 'whisperrpass.credential.approved',
  PASS_CREDENTIAL_EXPIRED: 'whisperrpass.credential.expired',

  // WhisperrTask events
  TASK_CREATED: 'whisperrtask.task.created',
  TASK_UPDATED: 'whisperrtask.task.updated',
  TASK_DELETED: 'whisperrtask.task.deleted',
  TASK_STATUS_CHANGED: 'whisperrtask.task.status_changed',
  TASK_ASSIGNED: 'whisperrtask.task.assigned',
  TASK_COMPLETED: 'whisperrtask.task.completed',
  TASK_COMMENT_ADDED: 'whisperrtask.task.comment_added',

  // Ecosystem-wide events
  SEARCH_QUERY: 'ecosystem.search.query',
  COMMAND_EXECUTED: 'ecosystem.command.executed',
  NOTIFICATION_CREATED: 'ecosystem.notification.created',
} as const

export type EventType = typeof EVENT_TYPES[keyof typeof EVENT_TYPES]
