export const API_BASE_URL = process.env.API_BASE_URL || '/api'

export const WHISPERR_APPS = {
  TASK: 'whisperrtask',
  NOTE: 'whisperrnote',
  MEET: 'whisperrmeet',
  PASS: 'whisperrpass',
  AUTH: 'whisperrauth',
} as const

export const TASK_STATUS = {
  TODO: 'todo',
  IN_PROGRESS: 'in_progress',
  BLOCKED: 'blocked',
  COMPLETED: 'completed',
} as const

export const NOTIFICATION_TYPES = {
  TASK_ASSIGNED: 'task_assigned',
  TASK_COMPLETED: 'task_completed',
  TASK_COMMENTED: 'task_commented',
  TASK_DUE_SOON: 'task_due_soon',
  MEETING_ACTION_ITEM: 'meeting_action_item',
  NOTE_TASK_CREATED: 'note_task_created',
} as const

export const CONTEXT_LINK_TYPES = {
  NOTE: 'note',
  MEETING: 'meeting',
  CREDENTIAL: 'credential',
  EXTERNAL: 'external',
} as const

export const AI_SUGGESTION_TYPES = {
  BOTTLENECK: 'bottleneck',
  PRIORITY: 'priority',
  CONTEXT: 'context',
  RESOURCE: 'resource',
} as const
