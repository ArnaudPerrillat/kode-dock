# KodeDock - Product Specification Document

**Version:** 1.0.0
**Last Updated:** 2025-12-05
**Status:** Active Development

---

## Table of Contents

1. [Product Overview](#product-overview)
2. [Core Value Proposition](#core-value-proposition)
3. [Target Audience](#target-audience)
4. [Key Features](#key-features)
5. [Technical Specifications](#technical-specifications)
6. [User Interface & Design](#user-interface--design)
7. [Feature Specifications](#feature-specifications)
8. [User Workflows](#user-workflows)
9. [Data Architecture](#data-architecture)
10. [Platform Support](#platform-support)
11. [Competitive Advantages](#competitive-advantages)
12. [Use Cases](#use-cases)
13. [Technology Stack](#technology-stack)
14. [Extensibility & Future Features](#extensibility--future-features)

---

## Product Overview

**KodeDock** is a modern desktop application for Windows that serves as a centralized dashboard for managing and organizing development projects. It provides developers with a visual, intuitive interface to organize projects into workspaces, quickly launch them in their preferred IDE, and manage development servers—all from one place.

### Product Type
- **Category:** Developer Productivity Tool
- **Platform:** Desktop Application (Electron-based)
- **Primary OS:** Windows (cross-platform compatible architecture)
- **License:** MIT
- **Pricing Model:** Free/Open Source (extensible for premium features)

### Mission Statement
To eliminate context switching and streamline the developer workflow by providing a beautiful, centralized hub for project management and quick access to development tools.

---

## Core Value Proposition

### Problem Statement
Developers often work on multiple projects simultaneously, leading to:
- Time wasted navigating file systems to find projects
- Context switching between terminal windows and IDE sessions
- Difficulty organizing related projects
- Manual management of development servers
- No centralized view of all active projects

### Solution
KodeDock provides:
- **Visual Project Dashboard:** See all your projects at a glance with rich metadata
- **Workspace Organization:** Group related projects into logical workspaces
- **One-Click IDE Launch:** Open any project in your preferred IDE instantly
- **Dev Server Management:** Start, stop, and monitor development servers with one click
- **Smart Search:** Quickly find projects by name, tags, path, or description
- **Beautiful UI:** Modern, responsive interface with light/dark themes

---

## Target Audience

### Primary Users
1. **Full-Stack Developers**
   - Working on multiple client projects
   - Managing frontend and backend repositories
   - Need quick access to different tech stacks

2. **Freelancers & Consultants**
   - Juggling numerous client projects
   - Frequent context switching
   - Need organized project categorization

3. **Agency Developers**
   - Managing multiple client workspaces
   - Team collaboration on various projects
   - Standardized project organization

4. **Students & Learners**
   - Managing course projects and personal experiments
   - Learning multiple technologies simultaneously
   - Need organized portfolio of projects

### Secondary Users
- Technical Team Leads
- DevOps Engineers
- Open Source Contributors
- Bootcamp Students

---

## Key Features

### Core Features

#### 1. Workspace Management
- Create unlimited workspaces to organize projects
- Rename and delete workspaces
- Drag-and-drop workspace reordering
- Visual workspace sidebar navigation
- Workspace-specific project collections

#### 2. Project Management
- Add projects manually or by selecting folders
- Rich project metadata (name, description, path, tags, icons)
- Custom icons from Lucide icon library
- Edit project details anytime
- Delete projects (without affecting actual files)
- Visual project cards with hover effects

#### 3. IDE Integration
- **Supported IDEs:**
  - Visual Studio Code
  - Cursor AI Editor
  - WebStorm
  - IntelliJ IDEA
  - Sublime Text
  - Atom
  - Notepad++
- One-click project opening in default IDE
- Configurable default IDE in settings
- Automatic IDE detection and PATH validation

#### 4. Development Server Management
- Start dev servers with custom commands
- Stop running dev servers
- Visual process status indicators
- Automatic URL detection and browser opening
- Configurable per-project:
  - Dev server command (default: `npm run dev`)
  - Auto-open in browser (default: enabled)
  - Open in external terminal (optional)
- Real-time process monitoring

#### 5. Search & Discovery
- **Local Search:** Filter projects within active workspace
- **Global Search:** Search across all workspaces (Ctrl+F / Cmd+F)
- Search by:
  - Project name
  - Description
  - File path
  - Tags
- Real-time search results

#### 6. Workspace Creation from Folders
- Select a parent folder containing multiple project folders
- Automatically create a workspace with all subfolders as projects
- Batch import for faster onboarding

#### 7. Project Details View
- Comprehensive project information panel
- Desktop: Side panel view (responsive)
- Mobile: Full-page view
- Quick actions panel
- Development settings display
- Open in file explorer integration

#### 8. Theming
- **Light Theme:** Clean, bright interface for daytime use
- **Dark Theme:** Eye-friendly dark mode for night coding
- **System Theme:** Automatic theme matching OS preference
- Real-time theme switching
- Persistent theme selection

#### 9. File System Integration
- Folder picker with native OS dialog
- Path validation and existence checking
- Open project folder in file explorer
- Create new folders from within app

---

## Technical Specifications

### Architecture
- **Framework:** Electron (desktop application framework)
- **Renderer Process:** React 18 with TypeScript
- **Main Process:** Node.js with Electron APIs
- **IPC Communication:** Secure context-isolated bridge via preload script
- **Build System:** Vite for fast development and optimized builds

### Performance
- **Startup Time:** < 2 seconds (cold start)
- **Search Response:** Real-time (< 100ms)
- **IDE Launch Time:** < 1 second
- **Memory Footprint:** ~150-200 MB (typical)

### Security
- Context isolation enabled
- No node integration in renderer
- Sandboxed renderer process
- IPC communication through secure bridge
- No remote code execution

### Data Persistence
- **Storage Type:** Local JSON file
- **Location:** `%APPDATA%\kodedock\kodedock-data.json` (Windows)
- **Format:** Pretty-printed JSON (human-readable)
- **Backup Strategy:** File-based (user can manually copy)
- **Data Size:** < 1 MB for hundreds of projects

---

## User Interface & Design

### Design System
- **Component Library:** shadcn/ui (Radix UI primitives)
- **Styling:** Tailwind CSS utility-first framework
- **Icons:** Lucide React (consistent icon set)
- **Typography:** System fonts (SF Pro on Mac, Segoe UI on Windows)
- **Animations:** Tailwind CSS animations (subtle, performant)

### Layout Structure
```
┌─────────────────────────────────────────────────┐
│  [Sidebar]  │  [Main Content Area]              │
│             │                                    │
│ Workspaces  │  Header (Workspace name + search) │
│ ────────    │  ─────────────────────────────── │
│ □ Work      │                                    │
│ □ Personal  │  [Project Cards Grid]             │
│ □ Learning  │  ┌──────┐ ┌──────┐ ┌──────┐     │
│             │  │ Proj1│ │ Proj2│ │ Proj3│     │
│ ─────────   │  └──────┘ └──────┘ └──────┘     │
│ ⚙ Settings  │  ┌──────┐ ┌──────┐              │
└─────────────│  │ Proj4│ │ Proj5│              │
              │  └──────┘ └──────┘              │
              └────────────────────────────────┘
```

### Color Palette

#### Light Theme
- **Background:** White (#ffffff)
- **Card Background:** Slate 50 (#f8fafc)
- **Foreground:** Slate 900 (#0f172a)
- **Muted:** Slate 100 (#f1f5f9)
- **Border:** Slate 200 (#e2e8f0)
- **Primary:** Blue 600 (#2563eb)
- **Accent:** Slate 100 (#f1f5f9)

#### Dark Theme
- **Background:** Slate 950 (#020617)
- **Card Background:** Slate 900 (#0f172a)
- **Foreground:** White (#ffffff)
- **Muted:** Slate 800 (#1e293b)
- **Border:** Slate 800 (#1e293b)
- **Primary:** Blue 500 (#3b82f6)
- **Accent:** Slate 800 (#1e293b)

### Responsive Design
- **Desktop First:** Optimized for 1200x800 minimum
- **Breakpoints:**
  - Mobile: < 768px
  - Tablet: 768px - 1024px
  - Desktop: > 1024px
- **Adaptive Layouts:**
  - Project Details: Side panel on desktop, full page on mobile
  - Project Grid: 4 columns → 2 columns → 1 column
  - Sidebar: Collapsible on mobile

---

## Feature Specifications

### 1. Workspace Management

#### Create Workspace
- **Trigger:** Click "+" button in sidebar
- **Input:** Workspace name (text input)
- **Validation:** Non-empty string
- **Action:** Creates new workspace, switches to it
- **Storage:** Adds to `workspaces` array in data file

#### Rename Workspace
- **Trigger:** Click edit icon on workspace in sidebar
- **Input:** New workspace name
- **Validation:** Non-empty string
- **Action:** Updates workspace name in place
- **UX:** Inline editing with save/cancel buttons

#### Delete Workspace
- **Trigger:** Click trash icon on workspace
- **Confirmation:** Dialog warning about deletion
- **Action:** Removes workspace and all its projects
- **Behavior:** Switches to next available workspace

#### Reorder Workspaces
- **Method 1:** Arrow buttons (up/down)
- **Method 2:** Drag and drop (future enhancement)
- **Persistence:** Order saved to data file

#### Create Workspace from Folder
- **Trigger:** "Create from folder" button
- **Flow:**
  1. Select parent folder
  2. Scan for subfolders
  3. Display subfolder checklist
  4. User selects folders to include
  5. Enter workspace name
  6. Create workspace with selected folders as projects

### 2. Project Management

#### Add Project
- **Trigger:** "Add Project" button
- **Form Fields:**
  - **Name:** Text input (required)
  - **Path:** Folder picker (required)
  - **Description:** Textarea (optional)
  - **Tags:** Tag input with add/remove (optional)
  - **Icon:** Icon picker from Lucide library (optional)
  - **Dev Server Enabled:** Toggle (default: on)
  - **Dev Server Command:** Text input (default: "npm run dev")
  - **Open in Browser:** Checkbox (default: checked)
  - **Open in Terminal:** Checkbox (default: unchecked)
- **Validation:**
  - Name and path required
  - Path must exist
- **Action:** Creates project in active workspace

#### Edit Project
- **Trigger:** Edit button in project card or details view
- **Form:** Same as Add Project, pre-filled with current values
- **Action:** Updates project in place

#### Delete Project
- **Trigger:** Delete button in project card or details view
- **Confirmation:** Dialog with project name
- **Warning:** "Project files will not be deleted from disk"
- **Action:** Removes project from workspace

#### View Project Details
- **Trigger:** Click "View Details" in project dropdown menu
- **Layout:**
  - Desktop: Side panel (50% width on large screens, 40% on XL)
  - Mobile: Full-page overlay
- **Content:**
  - Project header with icon and name
  - Description
  - Quick actions (Open IDE, Start/Stop Server, Open Explorer)
  - Project information (path, tags, created date)
  - Development settings

### 3. Development Server Management

#### Start Dev Server
- **Trigger:** Play button on project card or details view
- **Process:**
  1. Check if server already running
  2. Execute command in project directory
  3. Capture stdout/stderr
  4. Parse output for localhost URL using multiple regex patterns
  5. Auto-open URL in browser (if enabled)
  6. Show "Running" badge on project
- **Terminal Mode:**
  - Opens external terminal window
  - Runs command in new window
  - Detects URL in background process
  - Auto-opens browser if enabled
- **Error Handling:**
  - Display error message on project card
  - Failed process doesn't block UI

#### Stop Dev Server
- **Trigger:** Stop button (square icon) on running project
- **Process:**
  1. Find node process(es) running in project directory
  2. Kill process with force flag
  3. Remove "Running" badge
  4. Update UI state
- **Platform Handling:**
  - Windows: PowerShell with Get-CimInstance + taskkill
  - Unix: ps aux + kill -9

#### Process Detection
- **Polling:** On project card mount
- **Method:**
  - Windows: Query node.exe processes, match by path
  - Unix: grep ps output for node processes in project path
- **Accuracy:** Path normalization for reliable matching

### 4. IDE Integration

#### Open in IDE
- **Trigger:** Click project card or "Open in IDE" button
- **Command Execution:**
  - Builds command: `{ide-command} "{projectPath}"`
  - Executes via Node child_process
- **IDE Commands:**
  - VSCode: `code`
  - Cursor: `cursor`
  - WebStorm: `webstorm`
  - IntelliJ: `idea`
  - Sublime: `subl`
  - Atom: `atom`
  - Notepad++: `notepad++`
- **Error Handling:**
  - Check if IDE command exists in PATH
  - Display helpful error messages
  - Suggest PATH configuration

#### Default IDE Setting
- **Location:** Settings page
- **UI:** Radio button list of all supported IDEs
- **Persistence:** Stored in settings object
- **Application:** Used for all "Open in IDE" actions

### 5. Search & Discovery

#### Local Search (Workspace)
- **Location:** Header of workspace view
- **Input:** Text search box with search icon
- **Search Fields:**
  - Project name
  - Project description
  - Project path
  - Project tags
- **Behavior:**
  - Real-time filtering as user types
  - Case-insensitive search
  - Shows match count
  - Preserves original project order

#### Global Search (All Workspaces)
- **Trigger:** Ctrl+F / Cmd+F keyboard shortcut
- **UI:** Modal dialog overlay
- **Features:**
  - Search across all workspaces simultaneously
  - Group results by workspace
  - Click result to navigate to project
  - Same search fields as local search
- **UX:**
  - Esc to close
  - Click outside to close
  - Quick navigation with arrow keys

### 6. Theming

#### Theme Options
1. **Light Theme**
   - Clean, bright colors
   - High contrast for readability
   - Ideal for daytime coding

2. **Dark Theme**
   - Dark backgrounds, light text
   - Reduced eye strain
   - Popular for night coding

3. **System Theme**
   - Follows OS preference
   - Auto-switches with system
   - Listens to OS theme change events

#### Theme Switching
- **Location:** Settings page
- **UI:** Visual theme selector with preview cards
- **Application:** Instant theme change (no reload)
- **Persistence:** Saved in settings

---

## User Workflows

### Workflow 1: First-Time Setup
1. Launch KodeDock
2. See empty state with default "My Projects" workspace
3. Click "Add Project"
4. Browse for project folder
5. Enter project details
6. Click "Add Project"
7. Project appears as card in workspace
8. Click card to open in IDE

### Workflow 2: Daily Project Access
1. Launch KodeDock
2. See all workspaces and projects
3. Use search to find specific project
4. Click project card to open in IDE
5. Click play button to start dev server
6. Browser opens automatically to localhost
7. When done, click stop button to kill server

### Workflow 3: Organizing Multiple Projects
1. Create workspace "Client Work"
2. Create workspace "Personal"
3. Create workspace "Learning"
4. Add projects to appropriate workspaces
5. Switch between workspaces via sidebar
6. Rename workspace by clicking edit icon
7. Reorder workspaces with arrow buttons

### Workflow 4: Batch Importing Projects
1. Click "Create workspace from folder"
2. Select parent folder containing project subfolders
3. See list of detected subfolders
4. Check/uncheck folders to include
5. Enter workspace name
6. Click "Create"
7. All selected folders added as projects

### Workflow 5: Customizing Settings
1. Click "Settings" in sidebar
2. Select preferred theme (Light/Dark/System)
3. Select default IDE (VSCode, Cursor, etc.)
4. Changes apply immediately
5. Return to workspace view

---

## Data Architecture

### Data Model

```typescript
interface AppData {
  workspaces: Workspace[]
  settings: Settings
}

interface Workspace {
  id: string              // Unique identifier (timestamp-random)
  name: string            // Display name
  projects: Project[]     // Array of projects in workspace
}

interface Project {
  id: string              // Unique identifier (timestamp-random)
  name: string            // Display name
  path: string            // Absolute file system path
  description?: string    // Optional description
  tags: string[]          // Array of tag strings
  createdAt: string       // ISO 8601 timestamp
  icon?: string           // Lucide icon name
  devServerEnabled?: boolean      // Enable dev server feature (default: true)
  devServerCommand?: string       // Command to run (default: "npm run dev")
  openInBrowser?: boolean         // Auto-open browser (default: true)
  openInTerminal?: boolean        // Open in external terminal (default: false)
}

interface Settings {
  defaultIDE: IDE         // Default IDE for opening projects
  theme: Theme            // UI theme preference
}

type IDE = 'vscode' | 'cursor' | 'webstorm' | 'intellij' | 'sublime' | 'atom' | 'notepad++'

type Theme = 'light' | 'dark' | 'system'
```

### Data Storage

#### File Location
- **Windows:** `%APPDATA%\kodedock\kodedock-data.json`
- **macOS:** `~/Library/Application Support/kodedock/kodedock-data.json`
- **Linux:** `~/.config/kodedock/kodedock-data.json`

#### Example Data File
```json
{
  "workspaces": [
    {
      "id": "1701234567890-abc123def",
      "name": "Client Projects",
      "projects": [
        {
          "id": "1701234567891-xyz789ghi",
          "name": "E-commerce Site",
          "path": "C:\\Projects\\client-ecommerce",
          "description": "React + Node.js e-commerce platform",
          "tags": ["react", "nodejs", "mongodb"],
          "createdAt": "2024-11-29T10:30:00.000Z",
          "icon": "ShoppingCart",
          "devServerEnabled": true,
          "devServerCommand": "npm run dev",
          "openInBrowser": true,
          "openInTerminal": false
        }
      ]
    }
  ],
  "settings": {
    "defaultIDE": "vscode",
    "theme": "dark"
  }
}
```

### Data Operations

#### Read Operations
- Load on app startup
- Parse JSON with error handling
- Provide defaults if file missing
- Validate data structure

#### Write Operations
- Save on every data change
- Atomic write with pretty-print
- Async operation (non-blocking)
- Error logging to console

---

## Platform Support

### Current Support
- **Windows:** Full support (primary platform)
  - Windows 10 and 11
  - 64-bit architecture
  - NSIS installer and portable builds

### Future Platform Support
- **macOS:** Planned
  - Universal binary (Intel + Apple Silicon)
  - DMG installer
  - Code signing and notarization

- **Linux:** Planned
  - AppImage format
  - Debian/Ubuntu .deb packages
  - RPM packages for Fedora/RHEL

### System Requirements

#### Minimum
- **OS:** Windows 10 (64-bit)
- **RAM:** 4 GB
- **Disk Space:** 200 MB
- **Display:** 1280x720

#### Recommended
- **OS:** Windows 11 (64-bit)
- **RAM:** 8 GB or more
- **Disk Space:** 500 MB
- **Display:** 1920x1080 or higher

---

## Competitive Advantages

### vs. File Explorer
- Visual project cards with rich metadata
- One-click IDE launching
- Workspace organization
- Dev server management
- Instant search

### vs. Terminal/CLI
- No need to remember project paths
- Visual interface for beginners
- Click instead of typing commands
- Process management without manual PID tracking
- Works alongside terminal for power users

### vs. IDE Project Managers
- IDE-agnostic (works with any editor)
- Cross-project organization
- Lighter weight than IDE
- Independent of IDE startup time
- Manage projects not currently open

### vs. Notion/Trello for Project Tracking
- Direct IDE integration
- Actual file system integration
- Dev server automation
- Fast, local-only (no cloud sync lag)
- Purpose-built for developers

### Key Differentiators
1. **Speed:** Instant launch, no cloud sync
2. **Simplicity:** Clean, focused UI
3. **Flexibility:** Works with any IDE
4. **Privacy:** All data stored locally
5. **Free:** Open source, no subscription
6. **Beautiful:** Modern, polished design

---

## Use Cases

### Use Case 1: Freelance Developer
**Persona:** Sarah, a freelance full-stack developer
**Problem:** Managing 10+ client projects, switching between repos daily
**Solution:**
- Workspace per client
- Quick access to frontend and backend repos
- Start dev servers for both with one click
- Tag projects by tech stack for easy filtering

### Use Case 2: Bootcamp Student
**Persona:** Alex, learning web development
**Problem:** Dozens of small projects from lessons, can't find old exercises
**Solution:**
- Organize by course module
- Tag by technology (JavaScript, React, Node)
- Quick access to reference old projects
- Portfolio view of completed work

### Use Case 3: Agency Team Lead
**Persona:** Marcus, managing a team of developers
**Problem:** Standardizing project structure and access patterns
**Solution:**
- Shared workspace structure template
- Consistent dev server commands
- Easy onboarding for new team members
- Documentation via project descriptions

### Use Case 4: Open Source Contributor
**Persona:** Jamie, contributing to multiple OSS projects
**Problem:** Juggling different projects, each with different setup
**Solution:**
- Workspace for each organization
- Custom dev commands per project
- Tags for issue labels or feature areas
- Quick context switching

### Use Case 5: Polyglot Developer
**Persona:** Jordan, working across multiple tech stacks
**Problem:** Different IDEs for different languages
**Solution:**
- Per-project IDE configuration (future feature)
- Global default IDE setting
- Language tags for organization
- Universal project launcher

---

## Technology Stack

### Frontend (Renderer Process)
- **React 18:** UI library
- **TypeScript:** Type safety and developer experience
- **Tailwind CSS:** Utility-first styling
- **shadcn/ui:** Component library (Radix UI primitives)
- **Lucide React:** Icon library
- **class-variance-authority:** Component variant management
- **clsx / tailwind-merge:** Dynamic class names

### Backend (Main Process)
- **Electron:** Desktop application framework
- **Node.js:** JavaScript runtime
- **TypeScript:** Type-safe main process
- **IPC (Inter-Process Communication):** Secure communication bridge
- **child_process:** Process spawning and management
- **fs/promises:** Asynchronous file operations
- **path:** Path manipulation utilities

### Build Tools
- **Vite:** Fast build tool and dev server
- **vite-plugin-electron:** Electron integration for Vite
- **vite-plugin-electron-renderer:** Renderer process plugin
- **electron-builder:** Packaging and distribution
- **TypeScript Compiler:** Type checking and compilation

### Development Tools
- **ESLint:** Code linting (optional)
- **Prettier:** Code formatting (optional)
- **concurrently:** Run multiple dev scripts
- **wait-on:** Wait for dev server before launching Electron

### Distribution
- **electron-builder:** Creates installers
- **NSIS:** Windows installer format
- **Portable:** Standalone executable (no install)

---

## Extensibility & Future Features

### Planned Features (Roadmap)

#### Phase 2: Enhanced Functionality
- [ ] Project templates (quickly scaffold new projects)
- [ ] Git integration (show branch, status, recent commits)
- [ ] Recent projects quick access
- [ ] Project favorites/pinning
- [ ] Keyboard shortcuts (customizable)
- [ ] Project notes/documentation
- [ ] Multi-select project actions
- [ ] Bulk project operations

#### Phase 3: Advanced Features
- [ ] Team collaboration (cloud sync optional)
- [ ] Project sharing via export/import
- [ ] Docker container management
- [ ] Environment variable management
- [ ] Database connection configs
- [ ] API endpoint testing
- [ ] Custom scripts/commands per project
- [ ] Project health monitoring

#### Phase 4: Enterprise Features
- [ ] Team workspaces
- [ ] Role-based access control
- [ ] Audit logging
- [ ] SSO integration
- [ ] Project templates library
- [ ] Analytics and insights
- [ ] Custom integrations via plugins

### Plugin System (Future)
- **Architecture:** Node.js-based plugin API
- **Capabilities:**
  - Custom actions in project cards
  - Additional IDE integrations
  - Custom project metadata fields
  - Integration with external services (GitHub, Jira, etc.)
  - Custom themes and UI components
- **Distribution:** npm packages or local plugins

### API Extensions
- **CLI Tool:** Command-line interface for KodeDock
- **REST API:** Local HTTP server for external integrations
- **Webhooks:** Project lifecycle events
- **VS Code Extension:** Bi-directional integration

---

## Marketing & Positioning

### Tagline Options
- "Your Projects, Organized"
- "The Beautiful Project Launcher for Developers"
- "Stop Hunting for Projects. Start Coding."
- "All Your Projects, One Dashboard"
- "Developer Dashboard Done Right"

### Key Messaging
1. **Save Time:** Stop wasting time navigating folders
2. **Stay Organized:** Group projects into meaningful workspaces
3. **Work Smarter:** One-click access to IDE and dev servers
4. **Beautiful UI:** A tool you'll actually want to use
5. **Your Data:** Everything stored locally, no cloud required

### Feature Highlights for Landing Page
1. Workspace organization with visual cards
2. Support for 7+ popular IDEs
3. One-click dev server management
4. Global search across all projects
5. Beautiful dark and light themes
6. Free and open source

### Pricing Tiers (If Monetized)

#### Free (Current)
- Unlimited workspaces
- Unlimited projects
- All current features
- Community support

#### Pro (Future)
- Cloud sync across devices
- Team workspaces (shared)
- Advanced git integration
- Priority support
- Early access to new features
- **Price:** $5-10/month or $50-100/year

#### Enterprise (Future)
- All Pro features
- SSO integration
- Audit logs
- Custom integrations
- Dedicated support
- On-premise deployment option
- **Price:** Custom pricing per team

---

## Changelog & Version History

### Version 1.0.0 (Current)
**Release Date:** 2024-12-05

**Features:**
- Workspace management (create, rename, delete, reorder)
- Project management (add, edit, delete, view details)
- IDE integration (7 supported IDEs)
- Dev server management (start, stop, monitor)
- Local and global search
- Workspace creation from folder
- Theme support (light, dark, system)
- Project details view (side panel and full page)
- File explorer integration
- Custom project icons
- Project tagging system
- Custom dev server commands
- Terminal mode for dev servers
- Real-time process detection

**Technical:**
- Electron-based desktop app
- React 18 + TypeScript
- Tailwind CSS + shadcn/ui
- Local JSON storage
- Windows installer (NSIS + Portable)

---

## Support & Resources

### Documentation
- **README.md:** Installation and basic usage
- **PRODUCT_SPEC.md:** Complete feature specification (this document)
- **GitHub Wiki:** Detailed guides and tutorials (future)

### Community
- **GitHub Issues:** Bug reports and feature requests
- **GitHub Discussions:** Community support and ideas
- **Discord:** Real-time chat (future)

### Contributing
- Open to pull requests
- Contribution guidelines in CONTRIBUTING.md (future)
- Code of conduct
- MIT license allows commercial use

---

## Appendix

### Icon Map (Lucide Icons Used)
- FolderOpen: Default project icon
- Search: Search functionality
- Code2: IDE/coding related
- Settings: Settings gear
- Plus: Add actions
- Trash2: Delete actions
- Edit2: Edit actions
- Play: Start dev server
- Square: Stop dev server
- Calendar: Date display
- AlertCircle: Error states
- Check: Confirmation states
- X: Cancel/close actions
- MoreVertical: Menu dropdown
- Info: Information/details
- Terminal: Terminal/console
- Globe: Browser/web
- ExternalLink: External navigation
- ArrowLeft: Back navigation

### Keyboard Shortcuts
- **Ctrl+F / Cmd+F:** Open global search
- **Esc:** Close dialogs and modals
- **Enter:** Confirm in dialogs
- **Tab:** Navigate form fields

### File Paths Referenced
- Main app entry: `electron/main.ts`
- Renderer entry: `src/main.tsx`
- Main component: `src/App.tsx`
- Storage utilities: `src/lib/storage.ts`
- Type definitions: `src/types/index.ts`
- Components: `src/components/`

---

**Document Maintenance:** This document should be updated whenever new features are added, existing features are modified, or architectural decisions are made. All changes should include a date and description.

**Last Updated By:** Initial creation
**Next Review Date:** When new features are implemented
