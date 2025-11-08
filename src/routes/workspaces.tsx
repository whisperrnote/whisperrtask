import { createFileRoute } from '@tanstack/react-router'
import { Plus, FolderOpen } from 'lucide-react'

export const Route = createFileRoute('/workspaces')({ component: WorkspacesPage })

function WorkspacesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Workspaces</h1>
            <p className="text-gray-400">
              Organize your projects and teams
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg transition-colors">
            <Plus size={20} />
            <span>New Workspace</span>
          </button>
        </div>

        <div className="grid gap-4">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-6 hover:border-indigo-500/50 transition-all cursor-pointer">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-indigo-600/20 rounded-lg">
                <FolderOpen className="w-6 h-6 text-indigo-400" />
              </div>
              <div className="flex-1">
                <h3 className="text-xl font-semibold text-white mb-2">
                  Getting Started
                </h3>
                <p className="text-gray-400 text-sm">
                  Create your first workspace to start organizing tasks
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
