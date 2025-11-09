import { createFileRoute } from '@tanstack/react-router'
import { useState, useEffect, useRef } from 'react'
import { 
  Plus, 
  ListFilter, 
  Calendar, 
  LayoutList, 
  LayoutGrid,
  Sparkles,
  CheckSquare,
  AlertCircle,
  Clock,
  X
} from 'lucide-react'
import { taskService } from '../services/task.service'
import { TaskCard } from '../components/tasks/TaskCard'
import { prioritizeTasks, generateTodaysPlan } from '../lib/ai-engine'
import type { Task, TaskView, TaskFilters, Project } from '../types'

export const Route = createFileRoute('/tasks')({ component: TasksPage })

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [filteredTasks, setFilteredTasks] = useState<Task[]>([])
  const [view, setView] = useState<TaskView>('list')
  const [filters, setFilters] = useState<TaskFilters>({})
  const [showFilters, setShowFilters] = useState(false)
  const [showNewTask, setShowNewTask] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)
  const [stats, setStats] = useState({
    todaysFocus: 0,
    highValue: 0,
    inProgress: 0,
    blocked: 0,
  })

  // Load tasks on mount
  useEffect(() => {
    loadTasks()
    
    // Subscribe to task updates
    const unsubscribe = (window as any).__whisperr?.ecosystemBridge?.subscribe(
      'whisperrtask.task.*',
      () => loadTasks()
    )
    
    return () => unsubscribe?.()
  }, [])

  // Apply filters when tasks or filters change
  useEffect(() => {
    let filtered = [...tasks]
    
    if (filters.status && filters.status.length > 0) {
      filtered = filtered.filter(t => filters.status!.includes(t.status))
    }
    
    if (filters.assigneeIds && filters.assigneeIds.length > 0) {
      filtered = filtered.filter(t => 
        t.assigneeIds.some(id => filters.assigneeIds!.includes(id))
      )
    }
    
    if (filters.projectId) {
      filtered = filtered.filter(t => t.projectId === filters.projectId)
    }
    
    if (filters.valueScoreMin) {
      filtered = filtered.filter(t => (t.valueScore || 0) >= filters.valueScoreMin!)
    }
    
    // Sort by priority
    filtered = prioritizeTasks(filtered)
    
    setFilteredTasks(filtered)
    
    // Calculate stats
    const todaysPlan = generateTodaysPlan(tasks)
    setStats({
      todaysFocus: todaysPlan.length,
      highValue: tasks.filter(t => (t.valueScore || 0) > 70 && t.status !== 'completed').length,
      inProgress: tasks.filter(t => t.status === 'in_progress').length,
      blocked: tasks.filter(t => t.status === 'blocked').length,
    })
  }, [tasks, filters])

  const loadTasks = () => {
    const allTasks = taskService.getTasks()
    setTasks(allTasks)
  }

  const handleCreateTask = async () => {
    // This would open a proper task creation modal
    const demoProject = await (taskService as any).getOrCreateDefaultProject()
    const newTask = await taskService.createTask({
      projectId: demoProject.id,
      title: 'New Task ' + new Date().toLocaleTimeString(),
      description: 'Task created from UI',
    })
    
    if (newTask) {
      loadTasks()
      setShowNewTask(false)
    }
  }

  const handleStatusChange = (updatedTask: Task) => {
    setTasks(prev => prev.map(t => t.id === updatedTask.id ? updatedTask : t))
  }

  const getViewIcon = () => {
    switch (view) {
      case 'board': return LayoutGrid
      case 'calendar': return Calendar
      default: return LayoutList
    }
  }

  const ViewIcon = getViewIcon()

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">My Tasks</h1>
            <p className="text-gray-400">
              AI-powered task prioritization based on your goals
            </p>
          </div>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700"
            >
              <ListFilter size={20} />
              <span>Filter</span>
              {Object.keys(filters).length > 0 && (
                <span className="px-1.5 py-0.5 bg-indigo-600 rounded text-xs">
                  {Object.keys(filters).length}
                </span>
              )}
            </button>
            <div className="flex items-center bg-gray-800 border border-gray-700 rounded-lg">
              {(['list', 'board', 'calendar'] as TaskView[]).map(v => (
                <button
                  key={v}
                  onClick={() => setView(v)}
                  className={`px-3 py-2 ${
                    view === v 
                      ? 'bg-gray-700 text-white' 
                      : 'text-gray-400 hover:text-white'
                  } transition-colors first:rounded-l-lg last:rounded-r-lg`}
                >
                  {v === 'list' && <LayoutList size={20} />}
                  {v === 'board' && <LayoutGrid size={20} />}
                  {v === 'calendar' && <Calendar size={20} />}
                </button>
              ))}
            </div>
            <button 
              onClick={handleCreateTask}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
            >
              <Plus size={20} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        {/* Filter Panel */}
        {showFilters && (
          <div className="mb-6 p-4 bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-medium">Filters</h3>
              <button
                onClick={() => setFilters({})}
                className="text-sm text-gray-400 hover:text-white"
              >
                Clear all
              </button>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div>
                <label className="block text-sm text-gray-400 mb-2">Status</label>
                <div className="space-y-2">
                  {(['todo', 'in_progress', 'blocked', 'completed'] as const).map(status => (
                    <label key={status} className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={filters.status?.includes(status) || false}
                        onChange={(e) => {
                          const newStatus = [...(filters.status || [])]
                          if (e.target.checked) {
                            newStatus.push(status)
                          } else {
                            const idx = newStatus.indexOf(status)
                            if (idx > -1) newStatus.splice(idx, 1)
                          }
                          setFilters(prev => ({
                            ...prev,
                            status: newStatus.length > 0 ? newStatus : undefined
                          }))
                        }}
                        className="rounded border-gray-600 bg-gray-700 text-indigo-600"
                      />
                      <span className="text-gray-300 capitalize">
                        {status.replace('_', ' ')}
                      </span>
                    </label>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm text-gray-400 mb-2">
                  Min Value Score
                </label>
                <input
                  type="range"
                  min="0"
                  max="100"
                  value={filters.valueScoreMin || 0}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    valueScoreMin: parseInt(e.target.value) || undefined
                  }))}
                  className="w-full"
                />
                <span className="text-sm text-gray-300">
                  {filters.valueScoreMin || 0}+
                </span>
              </div>
            </div>
          </div>
        )}

        <div className="grid gap-6 md:grid-cols-4 mb-8">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Today's Focus</span>
              <Sparkles className="w-4 h-4 text-purple-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.todaysFocus} tasks</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">High Value</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.highValue} tasks</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">In Progress</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-2xl font-bold text-white">{stats.inProgress} tasks</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Blocked</span>
              <AlertCircle className="w-4 h-4 text-red-400" />
            </div>
            <div className="text-2xl font-bold text-white">{stats.blocked} tasks</div>
          </div>
        </div>

        {/* Task List/Board/Calendar */}
        {filteredTasks.length > 0 ? (
          <div>
            {view === 'list' && (
              <div className="space-y-3">
                {filteredTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    onClick={() => setSelectedTask(task)}
                    onStatusChange={handleStatusChange}
                  />
                ))}
              </div>
            )}
            
            {view === 'board' && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                {(['todo', 'in_progress', 'blocked', 'completed'] as const).map(status => (
                  <div key={status} className="space-y-3">
                    <h3 className="text-white font-medium mb-3 capitalize">
                      {status.replace('_', ' ')}
                    </h3>
                    <div className="space-y-3">
                      {filteredTasks
                        .filter(t => t.status === status)
                        .map(task => (
                          <TaskCard
                            key={task.id}
                            task={task}
                            onClick={() => setSelectedTask(task)}
                            onStatusChange={handleStatusChange}
                            showContext={false}
                          />
                        ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
            
            {view === 'calendar' && (
              <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
                <p className="text-center text-gray-400">
                  Calendar view coming soon...
                </p>
              </div>
            )}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
            <div className="text-center py-12">
              <CheckSquare className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                {tasks.length === 0 ? 'No tasks yet' : 'No tasks match your filters'}
              </h3>
              <p className="text-gray-500 mb-6">
                {tasks.length === 0 
                  ? 'Create your first task or let the AI import them from your notes and meetings'
                  : 'Try adjusting your filters to see more tasks'
                }
              </p>
              {tasks.length === 0 && (
                <button 
                  onClick={handleCreateTask}
                  className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
                >
                  Create Task
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
