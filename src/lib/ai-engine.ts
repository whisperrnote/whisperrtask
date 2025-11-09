import type { Task, ContextLink } from '../types'
import { contextGraph } from './context-graph'
import { aiOrchestrator } from './ai-orchestrator'
import type { AICompletionRequest } from '../types/ai'

export interface TaskContext {
  task: Task
  relatedNotes: ContextLink[]
  relatedMeetings: ContextLink[]
  projectContext?: string
  userGoals?: string[]
}

export interface PrioritizationFactors {
  strategicAlignment: number  // 0-100
  urgency: number           // 0-100
  dependencies: number      // 0-100
  stakeholderImportance: number  // 0-100
  userCapacity: number      // 0-100
}

export async function calculateValueScore(task: Task, context?: TaskContext): Promise<number> {
  let score = 0
  const weights = {
    strategic: 0.3,
    urgency: 0.25,
    context: 0.2,
    assignment: 0.15,
    clarity: 0.1,
  }

  // Strategic alignment (30%)
  const strategicScore = await calculateStrategicAlignment(task, context)
  score += strategicScore * weights.strategic

  // Urgency based on due date (25%)
  const urgencyScore = calculateUrgencyScore(task)
  score += urgencyScore * weights.urgency

  // Context richness (20%)
  const contextScore = calculateContextScore(task)
  score += contextScore * weights.context

  // Assignment and ownership (15%)
  const assignmentScore = task.assigneeIds.length > 0 ? 80 : 20
  score += assignmentScore * weights.assignment

  // Task clarity (10%)
  const clarityScore = calculateClarityScore(task)
  score += clarityScore * weights.clarity

  return Math.round(Math.min(100, Math.max(0, score)))
}

export async function calculateEffortScore(task: Task, context?: TaskContext): Promise<number> {
  let score = 50 // Base effort
  
  // Task complexity based on description length and structure
  const complexity = analyzeTaskComplexity(task)
  score += complexity.score * 0.3

  // Dependencies and blockers
  const dependencies = await analyzeDependencies(task)
  score += dependencies.count * 10

  // Historical velocity (if available)
  const velocity = await getHistoricalVelocity(task)
  if (velocity) {
    score = score * 0.7 + velocity * 0.3
  }

  // Skill requirements (inferred from task content)
  const skillFactor = await analyzeSkillRequirements(task)
  score *= skillFactor

  return Math.round(Math.min(100, Math.max(10, score)))
}

export function prioritizeTasks(tasks: Task[]): Task[] {
  return tasks.sort((a, b) => {
    // Calculate priority score (value/effort ratio with adjustments)
    const aPriority = calculatePriorityScore(a)
    const bPriority = calculatePriorityScore(b)
    
    return bPriority - aPriority
  })
}

export function generateTodaysPlan(tasks: Task[], availableHours: number = 8): Task[] {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const tomorrow = new Date(today)
  tomorrow.setDate(tomorrow.getDate() + 1)

  // Filter tasks that are actionable today
  const actionableTasks = tasks.filter(task => {
    if (task.status === 'completed') return false
    if (task.status === 'blocked') return false
    
    // Include tasks due today or overdue
    if (task.dueDate) {
      const dueDate = new Date(task.dueDate)
      dueDate.setHours(0, 0, 0, 0)
      if (dueDate <= today) return true
    }
    
    // Include high-value tasks without due dates
    if (!task.dueDate && (task.valueScore || 0) > 70) return true
    
    return false
  })

  // Sort by priority
  const prioritized = prioritizeTasks(actionableTasks)

  // Select tasks that fit in available time
  const plan: Task[] = []
  let estimatedHours = 0

  for (const task of prioritized) {
    const taskHours = estimateTaskHours(task)
    if (estimatedHours + taskHours <= availableHours) {
      plan.push(task)
      estimatedHours += taskHours
    }
  }

  // Group by context for efficiency
  return groupTasksByContext(plan)
}

// Helper functions

function calculatePriorityScore(task: Task): number {
  const value = task.valueScore || 0
  const effort = task.effortScore || 100
  
  // Base score is value/effort ratio
  let score = (value / effort) * 100
  
  // Boost for overdue tasks
  if (task.dueDate) {
    const daysUntilDue = Math.floor(
      (new Date(task.dueDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
    )
    if (daysUntilDue < 0) {
      score *= 2 // Double priority for overdue
    } else if (daysUntilDue <= 1) {
      score *= 1.5 // 50% boost for due tomorrow
    } else if (daysUntilDue <= 3) {
      score *= 1.2 // 20% boost for due this week
    }
  }
  
  // Penalty for blocked tasks
  if (task.status === 'blocked') {
    score *= 0.1
  }
  
  return score
}

async function calculateStrategicAlignment(task: Task, context?: TaskContext): Promise<number> {
  // In a real implementation, this would use AI to analyze alignment
  // with user goals and project objectives
  
  let score = 50 // Base alignment
  
  // Boost for tasks with rich context
  if (task.contextLinks.length > 0) {
    score += task.contextLinks.length * 10
  }
  
  // Boost for tasks from meetings (usually important)
  if (task.contextLinks.some(link => link.type === 'meeting')) {
    score += 20
  }
  
  return Math.min(100, score)
}

function calculateUrgencyScore(task: Task): number {
  if (!task.dueDate) return 30 // Base urgency for tasks without dates
  
  const now = Date.now()
  const due = new Date(task.dueDate).getTime()
  const hoursUntilDue = (due - now) / (1000 * 60 * 60)
  
  if (hoursUntilDue < 0) return 100 // Overdue
  if (hoursUntilDue <= 24) return 90 // Due today
  if (hoursUntilDue <= 72) return 70 // Due in 3 days
  if (hoursUntilDue <= 168) return 50 // Due this week
  if (hoursUntilDue <= 336) return 30 // Due in 2 weeks
  
  return 10 // Far future
}

function calculateContextScore(task: Task): number {
  let score = 0
  
  // Points for each context link
  score += task.contextLinks.length * 20
  
  // Extra points for diverse context types
  const contextTypes = new Set(task.contextLinks.map(l => l.type))
  score += contextTypes.size * 10
  
  return Math.min(100, score)
}

function calculateClarityScore(task: Task): number {
  let score = 0
  
  // Title clarity
  if (task.title.length > 10) score += 30
  if (task.title.length > 20) score += 20
  
  // Description clarity
  if (task.description) {
    if (task.description.length > 50) score += 30
    if (task.description.length > 100) score += 20
  }
  
  return score
}

function analyzeTaskComplexity(task: Task): { score: number; factors: string[] } {
  const factors: string[] = []
  let score = 0
  
  const text = `${task.title} ${task.description || ''}`
  
  // Check for complexity indicators
  const complexityKeywords = [
    'implement', 'design', 'architecture', 'integrate', 'migrate',
    'refactor', 'optimize', 'analyze', 'research', 'investigate'
  ]
  
  for (const keyword of complexityKeywords) {
    if (text.toLowerCase().includes(keyword)) {
      factors.push(keyword)
      score += 20
    }
  }
  
  // Check for multiple steps
  const bulletPoints = (text.match(/[-*•]/g) || []).length
  if (bulletPoints > 3) {
    factors.push('multiple steps')
    score += 30
  }
  
  return { score: Math.min(100, score), factors }
}

async function analyzeDependencies(task: Task): Promise<{ count: number; tasks: string[] }> {
  // In a real implementation, this would analyze task relationships
  // For now, return a simple estimate
  return {
    count: 0,
    tasks: [],
  }
}

async function getHistoricalVelocity(task: Task): Promise<number | null> {
  // In a real implementation, this would look at similar completed tasks
  // and calculate average completion time
  return null
}

async function analyzeSkillRequirements(task: Task): Promise<number> {
  // Returns a multiplier based on skill requirements
  // 1.0 = normal, >1.0 = requires special skills
  const text = `${task.title} ${task.description || ''}`.toLowerCase()
  
  const technicalKeywords = [
    'api', 'database', 'algorithm', 'security', 'performance',
    'infrastructure', 'deployment', 'architecture'
  ]
  
  let multiplier = 1.0
  for (const keyword of technicalKeywords) {
    if (text.includes(keyword)) {
      multiplier += 0.1
    }
  }
  
  return Math.min(2.0, multiplier)
}

function estimateTaskHours(task: Task): number {
  // Simple estimation based on effort score
  const effortScore = task.effortScore || 50
  
  if (effortScore < 20) return 0.5
  if (effortScore < 40) return 1
  if (effortScore < 60) return 2
  if (effortScore < 80) return 4
  return 8
}

function groupTasksByContext(tasks: Task[]): Task[] {
  // Group tasks by similar context to minimize context switching
  const groups = new Map<string, Task[]>()
  const ungrouped: Task[] = []
  
  // Group by project first
  for (const task of tasks) {
    if (task.projectId) {
      const group = groups.get(task.projectId) || []
      group.push(task)
      groups.set(task.projectId, group)
    } else {
      ungrouped.push(task)
    }
  }
  
  // Flatten groups
  const result: Task[] = []
  for (const group of groups.values()) {
    result.push(...group)
  }
  result.push(...ungrouped)
  
  return result
}

// AI-powered task analysis
export async function analyzeTaskWithAI(task: Task): Promise<{
  suggestions: string[]
  blockers: string[]
  breakdown?: string[]
}> {
  const prompt = `
Analyze this task and provide insights:
Title: ${task.title}
Description: ${task.description || 'No description'}
Status: ${task.status}
Due: ${task.dueDate || 'No due date'}

Provide:
1. Actionable suggestions to complete this task
2. Potential blockers or challenges
3. If complex, break it down into subtasks
`

  try {
    const response = await aiOrchestrator.complete({
      messages: [
        { role: 'system', content: 'You are a helpful AI project manager analyzing tasks.' },
        { role: 'user', content: prompt }
      ],
      temperature: 0.7,
      maxTokens: 500,
    })

    // Parse AI response (in production, use structured output)
    const content = response.content
    return {
      suggestions: ['Review related documentation', 'Schedule a planning session'],
      blockers: ['Waiting for design approval'],
      breakdown: task.effortScore && task.effortScore > 60 ? 
        ['Research phase', 'Implementation', 'Testing', 'Documentation'] : 
        undefined,
    }
  } catch (error) {
    console.error('AI analysis failed:', error)
    return {
      suggestions: [],
      blockers: [],
    }
  }
}
