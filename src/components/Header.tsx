import { Link } from '@tanstack/react-router'
import { useState, useEffect } from 'react'
import {
  Home,
  Menu,
  LayoutDashboard,
  CheckSquare,
  Inbox,
  Command,
  X,
  Bell,
} from 'lucide-react'
import { CommandPalette, useCommandPalette } from './ui/CommandPalette'
import { notificationService } from '../services/notification.service'

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const { isOpen: isCommandPaletteOpen, setIsOpen: setCommandPaletteOpen } = useCommandPalette()
  const [unreadCount, setUnreadCount] = useState(0)

  useEffect(() => {
    // Subscribe to notification updates
    const unsubscribe = notificationService.subscribe(() => {
      setUnreadCount(notificationService.getUnreadCount())
    })
    
    // Initial count
    setUnreadCount(notificationService.getUnreadCount())
    
    return () => unsubscribe()
  }, [])

  return (
    <>
      <header className="p-4 flex items-center bg-gray-900 text-white shadow-lg border-b border-gray-800">
        <button
          onClick={() => setIsOpen(true)}
          className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
          aria-label="Open menu"
        >
          <Menu size={24} />
        </button>
        <h1 className="ml-4 text-xl font-semibold">
          <Link to="/" className="flex items-center gap-2">
            <span className="text-2xl font-bold">WhisperrTask</span>
          </Link>
        </h1>
        <div className="ml-auto flex items-center gap-2">
          <Link
            to="/hub"
            className="relative p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400"
          >
            <Bell size={20} />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 w-5 h-5 bg-indigo-600 text-white text-xs rounded-full flex items-center justify-center">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </Link>
          <button 
            onClick={() => setCommandPaletteOpen(true)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors text-gray-400 flex items-center gap-2"
          >
            <Command size={20} />
            <kbd className="hidden md:inline-block px-2 py-0.5 text-xs text-gray-500 bg-gray-800 rounded">
              ⌘K
            </kbd>
          </button>
        </div>
      </header>

      <aside
        className={`fixed top-0 left-0 h-full w-80 bg-gray-900 text-white shadow-2xl z-50 transform transition-transform duration-300 ease-in-out flex flex-col ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between p-4 border-b border-gray-800">
          <h2 className="text-xl font-bold">WhisperrTask</h2>
          <button
            onClick={() => setIsOpen(false)}
            className="p-2 hover:bg-gray-800 rounded-lg transition-colors"
            aria-label="Close menu"
          >
            <X size={24} />
          </button>
        </div>

        <nav className="flex-1 p-4 overflow-y-auto">
          <Link
            to="/"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors mb-2',
            }}
          >
            <Home size={20} />
            <span className="font-medium">Home</span>
          </Link>

          <Link
            to="/workspaces"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors mb-2',
            }}
          >
            <LayoutDashboard size={20} />
            <span className="font-medium">Workspaces</span>
          </Link>

          <Link
            to="/tasks"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors mb-2',
            }}
          >
            <CheckSquare size={20} />
            <span className="font-medium">My Tasks</span>
          </Link>

          <Link
            to="/hub"
            onClick={() => setIsOpen(false)}
            className="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-800 transition-colors mb-2"
            activeProps={{
              className:
                'flex items-center gap-3 p-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 transition-colors mb-2',
            }}
          >
            <Inbox size={20} />
            <span className="font-medium">Whisperr Hub</span>
          </Link>
        </nav>
      </aside>

      {/* Overlay when sidebar is open */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40"
          onClick={() => setIsOpen(false)}
        />
      )}

      {/* Command Palette */}
      <CommandPalette
        isOpen={isCommandPaletteOpen}
        onClose={() => setCommandPaletteOpen(false)}
      />
    </>
  )
}
