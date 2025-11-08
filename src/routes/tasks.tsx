import { createFileRoute } from '@tanstack/react-router'
import { Plus, ListFilter, Calendar, LayoutList } from 'lucide-react'

export const Route = createFileRoute('/tasks')({ component: TasksPage })

function TasksPage() {
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
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
              <ListFilter size={20} />
              <span>Filter</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
              <LayoutList size={20} />
              <span>View</span>
            </button>
            <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              <Plus size={20} />
              <span>New Task</span>
            </button>
          </div>
        </div>

        <div className="grid gap-6 md:grid-cols-3 mb-8">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">Today's Focus</span>
              <Calendar className="w-4 h-4 text-indigo-400" />
            </div>
            <div className="text-2xl font-bold text-white">0 tasks</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">High Value</span>
              <div className="w-2 h-2 bg-green-500 rounded-full"></div>
            </div>
            <div className="text-2xl font-bold text-white">0 tasks</div>
          </div>

          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-gray-400 text-sm">In Progress</span>
              <div className="w-2 h-2 bg-blue-500 rounded-full"></div>
            </div>
            <div className="text-2xl font-bold text-white">0 tasks</div>
          </div>
        </div>

        <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
          <div className="text-center py-12">
            <Calendar className="w-16 h-16 text-gray-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-400 mb-2">
              No tasks yet
            </h3>
            <p className="text-gray-500 mb-6">
              Create your first task or let the AI import them from your notes and meetings
            </p>
            <button className="px-6 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
              Create Task
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
