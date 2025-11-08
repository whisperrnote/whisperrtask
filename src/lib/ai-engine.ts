import type { Task } from '../types'

export function calculateValueScore(task: Task): number {
  return 0
}

export function calculateEffortScore(task: Task): number {
  return 0
}

export function prioritizeTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    const aValue = a.valueScore || 0
    const bValue = b.valueScore || 0
    const aEffort = a.effortScore || 100
    const bEffort = b.effortScore || 100
    
    const aScore = aValue / aEffort
    const bScore = bValue / bEffort
    
    return bScore - aScore
  })
}
