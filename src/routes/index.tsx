import { createFileRoute, Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import { 
  CheckSquare, 
  Calendar, 
  Users, 
  Brain,
  Zap,
  ArrowRight,
  Sparkles,
  Network,
  Shield
} from 'lucide-react'
import { taskService } from '../services/task.service'
import { notificationService } from '../services/notification.service'
import { TaskCard } from '../components/tasks/TaskCard'
import { generateTodaysPlan } from '../lib/ai-engine'
import type { Task } from '../types'

export const Route = createFileRoute('/')({
  component: RouteComponent,
})

function RouteComponent() {
  const [todaysTasks, setTodaysTasks] = useState<Task[]>([])
  const [stats, setStats] = useState({
    totalTasks: 0,
    completedToday: 0,
    unreadNotifications: 0,
  })

  useEffect(() => {
    // Load today's plan
    const allTasks = taskService.getTasks()
    const plan = generateTodaysPlan(allTasks)
    setTodaysTasks(plan.slice(0, 3))

    // Calculate stats
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    
    const completedToday = allTasks.filter(t => {
      if (t.status !== 'completed') return false
      const updatedDate = new Date(t.updatedAt)
      updatedDate.setHours(0, 0, 0, 0)
      return updatedDate.getTime() === today.getTime()
    }).length

    setStats({
      totalTasks: allTasks.filter(t => t.status !== 'completed').length,
      completedToday,
      unreadNotifications: notificationService.getUnreadCount(),
    })
  }, [])

  const features = [
    {
      icon: Brain,
      title: 'AI-Powered Prioritization',
      description: 'Smart algorithms analyze context to suggest what to work on next',
      color: 'from-purple-600 to-pink-600',
    },
    {
      icon: Network,
      title: 'Ecosystem Integration',
      description: 'Seamless sync with WhisperrNote, WhisperrMeet, and WhisperrPass',
      color: 'from-blue-600 to-cyan-600',
    },
    {
      icon: Shield,
      title: 'Security First',
      description: 'Zero-knowledge architecture with end-to-end encryption',
      color: 'from-green-600 to-emerald-600',
    },
  ]

  return (
    <div className="max-w-7xl mx-auto p-6 space-y-8">
      {/* Hero Section */}
      <div className="text-center space-y-4 py-12">
        <h1 className="text-5xl font-bold bg-gradient-to-r from-indigo-400 to-purple-400 bg-clip-text text-transparent">
          Welcome to WhisperrTask
        </h1>
        <p className="text-xl text-gray-400 max-w-2xl mx-auto">
          Your intelligent task management system that amplifies human agency through AI and seamless ecosystem integration
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <CheckSquare className="w-8 h-8 text-blue-400" />
            <span className="text-3xl font-bold text-white">{stats.totalTasks}</span>
          </div>
          <p className="text-gray-400">Active Tasks</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Sparkles className="w-8 h-8 text-green-400" />
            <span className="text-3xl font-bold text-white">{stats.completedToday}</span>
          </div>
          <p className="text-gray-400">Completed Today</p>
        </div>
        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
          <div className="flex items-center justify-between mb-2">
            <Zap className="w-8 h-8 text-yellow-400" />
            <span className="text-3xl font-bold text-white">{stats.unreadNotifications}</span>
          </div>
          <p className="text-gray-400">Notifications</p>
        </div>
      </div>

      {/* Today's Plan */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-2xl font-semibold text-white">Today's AI-Curated Plan</h2>
          <Link
            to="/tasks"
            className="flex items-center gap-2 text-indigo-400 hover:text-indigo-300 transition-colors"
          >
            View all tasks
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        {todaysTasks.length > 0 ? (
          <div className="space-y-3">
            {todaysTasks.map(task => (
              <TaskCard
                key={task.id}
                task={task}
                onStatusChange={(updated) => {
                  setTodaysTasks(prev => 
                    prev.map(t => t.id === updated.id ? updated : t)
                  )
                }}
              />
            ))}
          </div>
        ) : (
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-12 text-center">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <p className="text-gray-400 text-lg">No tasks scheduled for today</p>
            <p className="text-gray-500 mt-2">Create a task or wait for AI to suggest priorities</p>
          </div>
        )}
      </div>

      {/* Features */}
      <div className="space-y-4">
        <h2 className="text-2xl font-semibold text-white">Powered by Intelligence</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {features.map((feature, index) => {
            const Icon = feature.icon
            return (
              <div
                key={index}
                className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all"
              >
                <div className={`w-12 h-12 rounded-lg bg-gradient-to-br ${feature.color} p-3 mb-4`}>
                  <Icon className="w-full h-full text-white" />
                </div>
                <h3 className="text-lg font-semibold text-white mb-2">{feature.title}</h3>
                <p className="text-gray-400 text-sm">{feature.description}</p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Quick Actions */}
      <div className="flex justify-center gap-4">
        <Link
          to="/tasks"
          className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors"
        >
          Go to Tasks
        </Link>
        <Link
          to="/hub"
          className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors"
        >
          Open Hub
        </Link>
      </div>
    </div>
  )
}
