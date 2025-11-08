# WhisperrTask

WhisperrTask is the intelligent action center of the Whisperr ecosystem - a next-generation task management platform that serves as the connective tissue between WhisperrNote, WhisperrMeet, WhisperrPass, and WhisperrAuth.

## Overview

WhisperrTask is not a standalone to-do list. It's designed to solve the core pain points of data silos and context switching by providing:

- **AI-Powered Intelligence**: Leverages your private knowledge graph across the Whisperr ecosystem
- **Unified Workflow**: Seamlessly syncs tasks with notes, meetings, and credentials
- **Contextual Actions**: AI automatically creates and prioritizes tasks based on your goals and availability
- **Ecosystem Integration**: Bi-directional sync with WhisperrNote, automatic task creation from WhisperrMeet, secure credential access via WhisperrPass

## Tech Stack

- **Framework**: TanStack Start (React + TanStack Router)
- **Runtime**: Bun
- **Styling**: Tailwind CSS v4
- **Icons**: Lucide React

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) installed on your system

### Installation

```bash
# Install dependencies
bun install
```

### Development

```bash
# Start the development server
bun run dev
```

The application will be available at `http://localhost:3000`

### Building

```bash
# Build for production
bun run build
```

### Preview Production Build

```bash
# Preview the production build
bun run serve
```

## Project Structure

```
src/
├── api/              # API client and service layers
├── components/       # React components
│   ├── hub/         # Whisperr Hub (unified inbox) components
│   ├── tasks/       # Task management components
│   ├── ui/          # Reusable UI components
│   └── workspaces/  # Workspace components
├── hooks/           # Custom React hooks
├── lib/             # Utility functions and core logic
│   ├── ai-engine.ts # AI prioritization and scoring
│   ├── constants.ts # App-wide constants
│   └── utils.ts     # Helper utilities
├── routes/          # TanStack Router routes
├── store/           # State management
└── types/           # TypeScript type definitions
```

## Key Features (In Development)

### Core Task Management
- Workspaces > Projects > Tasks > Subtasks hierarchy
- Multiple views: List, Board (Kanban), Calendar
- Rich task fields with AI-calculated Value and Effort scores
- Comments and @mentions

### AI Superagency Engine
- Intelligent prioritization based on strategic goals
- Contextual AI with knowledge graph integration
- Predictive and autonomous workflows
- AI Project Manager capabilities

### Unified Ecosystem UX
- **Whisperr Hub**: Unified inbox across all Whisperr apps
- **Global Command Palette** (Cmd+K): Cross-app natural language commands
- **Federated Search**: Search across tasks, notes, meetings, and credentials

### Ecosystem Integrations (MVE)
1. **WhisperrMeet → WhisperrTask**: Automatic task creation from meeting transcripts
2. **WhisperrNote ↔ WhisperrTask**: Bi-directional sync with note checklists
3. **WhisperrPass/WhisperrAuth → WhisperrTask**: Secure credential management for integrations

## Development Roadmap

See `.docx/prd.md` for the complete Product Requirements Document.

## License

Proprietary - Part of the Whisperr Ecosystem

