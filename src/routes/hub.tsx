import { createFileRoute } from '@tanstack/react-router'
import { Inbox, Bell, Filter } from 'lucide-react'

export const Route = createFileRoute('/hub')({ component: HubPage })

function HubPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-gray-900 to-slate-900">
      <div className="max-w-5xl mx-auto px-6 py-12">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-white mb-2">Whisperr Hub</h1>
            <p className="text-gray-400">
              Unified inbox across your entire ecosystem
            </p>
          </div>
          <button className="flex items-center gap-2 px-4 py-2 bg-gray-800 hover:bg-gray-700 text-white rounded-lg transition-colors border border-gray-700">
            <Filter size={20} />
            <span>Filter</span>
          </button>
        </div>

        <div className="space-y-4">
          <div className="bg-gray-800/50 backdrop-blur border border-gray-700 rounded-xl p-8">
            <div className="text-center py-12">
              <Inbox className="w-16 h-16 text-gray-600 mx-auto mb-4" />
              <h3 className="text-xl font-semibold text-gray-400 mb-2">
                All caught up
              </h3>
              <p className="text-gray-500">
                You have no notifications from WhisperrTask, WhisperrNote, WhisperrMeet, or WhisperrPass
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8 p-6 bg-indigo-600/10 border border-indigo-500/30 rounded-xl">
          <div className="flex items-start gap-4">
            <Bell className="w-6 h-6 text-indigo-400 flex-shrink-0 mt-1" />
            <div>
              <h4 className="text-white font-semibold mb-1">
                Actionable Notifications
              </h4>
              <p className="text-gray-400 text-sm">
                Notifications in the Hub are not just links - they're actionable UI components. 
                Complete tasks, respond to comments, or reschedule meetings directly from here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
