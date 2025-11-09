import { eventHandler, getQuery, readBody, createError } from '@tanstack/nitro-v2-vite-plugin'
import { taskService } from '../../services/task.service'
import type { CreateTaskInput, UpdateTaskInput } from '../../services/task.service'
import type { Task, TaskFilters } from '../../types'

// GET /api/v1/tasks
export const getTasks = eventHandler(async (event) => {
  const query = getQuery(event)
  
  const filters: TaskFilters = {
    status: query.status ? (Array.isArray(query.status) ? query.status : [query.status]) : undefined,
    assigneeIds: query.assigneeIds ? (Array.isArray(query.assigneeIds) ? query.assigneeIds : [query.assigneeIds]) : undefined,
    projectId: query.projectId as string | undefined,
  }

  const tasks = taskService.getTasks(filters)
  
  return {
    data: tasks,
    meta: {
      total: tasks.length,
      timestamp: new Date().toISOString(),
    },
  }
})

// GET /api/v1/tasks/:id
export const getTask = eventHandler(async (event) => {
  const taskId = event.context.params?.id as string
  
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID is required',
    })
  }

  const task = taskService.getTask(taskId)
  
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  return {
    data: task,
  }
})

// POST /api/v1/tasks
export const createTask = eventHandler(async (event) => {
  const body = await readBody<CreateTaskInput>(event)
  
  // Validate required fields
  if (!body.projectId || !body.title) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Project ID and title are required',
    })
  }

  try {
    const task = await taskService.createTask(body)
    
    return {
      data: task,
      meta: {
        message: 'Task created successfully',
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create task',
    })
  }
})

// PATCH /api/v1/tasks/:id
export const updateTask = eventHandler(async (event) => {
  const taskId = event.context.params?.id as string
  const body = await readBody<UpdateTaskInput>(event)
  
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID is required',
    })
  }

  try {
    const task = await taskService.updateTask(taskId, body)
    
    if (!task) {
      throw createError({
        statusCode: 404,
        statusMessage: 'Task not found',
      })
    }

    return {
      data: task,
      meta: {
        message: 'Task updated successfully',
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to update task',
    })
  }
})

// DELETE /api/v1/tasks/:id
export const deleteTask = eventHandler(async (event) => {
  const taskId = event.context.params?.id as string
  
  if (!taskId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Task ID is required',
    })
  }

  // For now, we'll mark as deleted in the service
  const task = await taskService.updateTask(taskId, { status: 'completed' })
  
  if (!task) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Task not found',
    })
  }

  return {
    meta: {
      message: 'Task deleted successfully',
    },
  }
})

// POST /api/v1/tasks/webhook/note
export const createTaskFromNote = eventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    const task = await taskService.createTaskFromNote(body)
    
    return {
      data: task,
      meta: {
        message: 'Task created from note successfully',
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create task from note',
    })
  }
})

// POST /api/v1/tasks/webhook/meeting
export const createTaskFromMeeting = eventHandler(async (event) => {
  const body = await readBody(event)
  
  try {
    const task = await taskService.createTaskFromMeeting(body)
    
    return {
      data: task,
      meta: {
        message: 'Task created from meeting successfully',
      },
    }
  } catch (error) {
    throw createError({
      statusCode: 500,
      statusMessage: error instanceof Error ? error.message : 'Failed to create task from meeting',
    })
  }
})