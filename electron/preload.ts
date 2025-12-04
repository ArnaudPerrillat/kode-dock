import { contextBridge, ipcRenderer } from 'electron'

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

export interface Workspace {
  id: string
  name: string
  projects: Project[]
}

export interface Project {
  id: string
  name: string
  path: string
  description?: string
  tags: string[]
  createdAt: string
  icon?: string
}

export interface ElectronAPI {
  readData: () => Promise<AppData>
  writeData: (data: AppData) => Promise<{ success: boolean; error?: string }>
  openInVSCode: (path: string) => Promise<{ success: boolean; error?: string }>
  openInIDE: (path: string, ide: IDE) => Promise<{ success: boolean; error?: string }>
  selectFolder: () => Promise<{ canceled: boolean; path?: string; error?: string }>
  pathExists: (path: string) => Promise<boolean>
  createFolder: (path: string) => Promise<{ success: boolean; path?: string; error?: string }>
}

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  readData: () => ipcRenderer.invoke('read-data'),
  writeData: (data: AppData) => ipcRenderer.invoke('write-data', data),
  openInVSCode: (path: string) => ipcRenderer.invoke('open-in-vscode', path),
  openInIDE: (path: string, ide: IDE) => ipcRenderer.invoke('open-in-ide', path, ide),
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  pathExists: (path: string) => ipcRenderer.invoke('path-exists', path),
  createFolder: (path: string) => ipcRenderer.invoke('create-folder', path)
} as ElectronAPI)
