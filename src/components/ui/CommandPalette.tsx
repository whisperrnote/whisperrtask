import { useState, useEffect, useRef, useCallback } from 'react'
import { 
  Command, 
  Search, 
  Plus,
  Calendar,
  Hash,
  Users,
  FileText,
  Video,
  Key,
  ArrowRight,
  Clock
} from 'lucide-react'
import { commandPaletteService } from '../../services/command-palette.service'
import type { Command as CommandType } from '../../services/command-palette.service'

interface CommandPaletteProps {
  isOpen: boolean
  onClose: () => void
}

export function CommandPalette({ isOpen, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('')
  const [suggestions, setSuggestions] = useState<CommandType[]>([])
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isExecuting, setIsExecuting] = useState(false)
  const [history, setHistory] = useState<string[]>([])
  const inputRef = useRef<HTMLInputElement>(null)

  // Load history on mount
  useEffect(() => {
    setHistory(commandPaletteService.getHistory())
  }, [])

  // Search for commands when query changes
  useEffect(() => {
    if (query) {
      const results = commandPaletteService.searchCommands(query)
      setSuggestions(results)
      setSelectedIndex(0)
    } else {
      // Show favorites when empty
      setSuggestions(commandPaletteService.getFavorites())
      setSelectedIndex(0)
    }
  }, [query])

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return

      switch (e.key) {
        case 'Escape':
          e.preventDefault()
          onClose()
          break
        case 'ArrowDown':
          e.preventDefault()
          setSelectedIndex(i => Math.min(i + 1, suggestions.length - 1))
          break
        case 'ArrowUp':
          e.preventDefault()
          setSelectedIndex(i => Math.max(i - 1, 0))
          break
        case 'Enter':
          e.preventDefault()
          if (suggestions[selectedIndex]) {
            handleExecute(suggestions[selectedIndex])
          } else if (query) {
            handleExecute(null)
          }
          break
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      inputRef.current?.focus()
      setQuery('')
    }

    return () => {
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, onClose, selectedIndex, suggestions, query])

  const handleExecute = useCallback(async (command: CommandType | null) => {
    setIsExecuting(true)
    try {
      if (command) {
        await command.handler({ text: query })
      } else {
        // Execute raw query
        await commandPaletteService.executeCommand(query)
      }
      onClose()
    } catch (error) {
      console.error('Command execution failed:', error)
    } finally {
      setIsExecuting(false)
    }
  }, [query, onClose])

  const getCommandIcon = (category: CommandType['category']) => {
    switch (category) {
      case 'task':
        return <Plus className="w-4 h-4" />
      case 'navigation':
        return <Hash className="w-4 h-4" />
      case 'search':
        return <Search className="w-4 h-4" />
      case 'ecosystem':
        return <Command className="w-4 h-4" />
      case 'settings':
        return <Key className="w-4 h-4" />
      default:
        return <Command className="w-4 h-4" />
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-20 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-2xl bg-gray-900 border border-gray-700 rounded-xl shadow-2xl overflow-hidden">
        <div className="flex items-center gap-3 px-4 py-3 border-b border-gray-700">
          <Search className="w-5 h-5 text-gray-400" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search or type a command..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="flex-1 bg-transparent text-white outline-none placeholder:text-gray-500"
          />
          <kbd className="px-2 py-1 text-xs text-gray-400 bg-gray-800 rounded">
            Cmd+K
          </kbd>
        </div>

        <div className="p-2 max-h-96 overflow-y-auto">
          {!query && history.length > 0 && (
            <div className="mb-4">
              <p className="text-xs text-gray-500 px-2 mb-2">Recent</p>
              {history.slice(0, 3).map((item, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(item)}
                  className="w-full flex items-center gap-2 px-2 py-1.5 text-sm text-gray-300 hover:bg-gray-800 rounded"
                >
                  <Clock className="w-4 h-4 text-gray-500" />
                  <span>{item}</span>
                </button>
              ))}
            </div>
          )}

          {suggestions.length > 0 ? (
            <div>
              <p className="text-xs text-gray-500 px-2 mb-2">
                {query ? 'Commands' : 'Favorites'}
              </p>
              {suggestions.map((command, index) => (
                <button
                  key={command.id}
                  onClick={() => handleExecute(command)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-sm rounded ${
                    index === selectedIndex
                      ? 'bg-blue-600 text-white'
                      : 'text-gray-300 hover:bg-gray-800'
                  }`}
                >
                  {getCommandIcon(command.category)}
                  <div className="flex-1 text-left">
                    <p className="font-medium">{command.name}</p>
                    <p className={`text-xs ${
                      index === selectedIndex ? 'text-blue-200' : 'text-gray-500'
                    }`}>
                      {command.description}
                    </p>
                  </div>
                  {command.shortcut && (
                    <kbd className="px-2 py-0.5 text-xs bg-gray-800 rounded">
                      {command.shortcut}
                    </kbd>
                  )}
                </button>
              ))}
            </div>
          ) : query ? (
            <div>
              <p className="text-xs text-gray-500 px-2 mb-2">Quick Actions</p>
              <button
                onClick={() => handleExecute(null)}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-300 hover:bg-gray-800 rounded"
              >
                <ArrowRight className="w-4 h-4" />
                <span>
                  Press <kbd className="px-1 py-0.5 mx-1 text-xs bg-gray-800 rounded">Enter</kbd>
                  to execute: <span className="font-medium">{query}</span>
                </span>
              </button>
            </div>
          ) : (
            <div className="text-center py-12 text-gray-500">
              <p>Type to search or create...</p>
              <p className="text-xs mt-2">Try: "Create task", "Find notes", "Start meeting"</p>
            </div>
          )}

          {isExecuting && (
            <div className="absolute inset-0 bg-gray-900/80 flex items-center justify-center">
              <div className="text-white">Executing...</div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export function useCommandPalette() {
  const [isOpen, setIsOpen] = useState(false)

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(prev => !prev)
      }
    }

    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [])

  return { isOpen, setIsOpen }
}
