import { useState, useEffect } from 'react'
import type { Task } from '../types'
import { apiClient } from '../api/client'

export function useTasks(projectId?: string) {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchTasks = async () => {
      try {
        setLoading(true)
        const data = projectId 
          ? await apiClient.getTasks(projectId)
          : await apiClient.getMyTasks()
        setTasks(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchTasks()
  }, [projectId])

  return { tasks, loading, error, refetch: () => {} }
}

export function useTaskMutations() {
  const createTask = async (data: Partial<Task>) => {
    return await apiClient.createTask(data)
  }

  const updateTask = async (id: string, data: Partial<Task>) => {
    return await apiClient.updateTask(id, data)
  }

  const deleteTask = async (id: string) => {
    return await apiClient.deleteTask(id)
  }

  return {
    createTask,
    updateTask,
    deleteTask,
  }
}
