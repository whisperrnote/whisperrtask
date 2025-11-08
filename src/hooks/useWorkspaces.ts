import { useState, useEffect } from 'react'
import type { Workspace } from '../types'
import { apiClient } from '../api/client'

export function useWorkspaces() {
  const [workspaces, setWorkspaces] = useState<Workspace[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<Error | null>(null)

  useEffect(() => {
    const fetchWorkspaces = async () => {
      try {
        setLoading(true)
        const data = await apiClient.getWorkspaces()
        setWorkspaces(data)
      } catch (err) {
        setError(err as Error)
      } finally {
        setLoading(false)
      }
    }

    fetchWorkspaces()
  }, [])

  return { workspaces, loading, error, refetch: () => {} }
}

export function useWorkspaceMutations() {
  const createWorkspace = async (data: Partial<Workspace>) => {
    return await apiClient.createWorkspace(data)
  }

  return {
    createWorkspace,
  }
}
