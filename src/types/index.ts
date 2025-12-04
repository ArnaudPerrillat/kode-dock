export interface Project {
  id: string
  name: string
  path: string
  description?: string
  tags: string[]
  createdAt: string
  icon?: string
}

export interface Workspace {
  id: string
  name: string
  projects: Project[]
}

export type IDE = 'vscode' | 'cursor' | 'webstorm' | 'intellij' | 'sublime' | 'atom' | 'notepad++'

export type Theme = 'light' | 'dark' | 'system'

export interface Settings {
  defaultIDE: IDE
  theme: Theme
}

export interface AppData {
  workspaces: Workspace[]
  settings: Settings
}
