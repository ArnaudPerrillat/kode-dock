import { app, BrowserWindow, ipcMain, dialog } from 'electron'
import { exec } from 'child_process'
import { promisify } from 'util'
import path from 'path'
import fs from 'fs/promises'

const execAsync = promisify(exec)

let mainWindow: BrowserWindow | null = null
const isDev = process.env.NODE_ENV === 'development' || !app.isPackaged

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, '../build/icon.ico')
  })

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173')
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow()
    }
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// Get the data file path
function getDataFilePath(): string {
  const userDataPath = app.getPath('userData')
  return path.join(userDataPath, 'kodedock-data.json')
}

// IPC Handlers

// Read data from JSON file
ipcMain.handle('read-data', async () => {
  try {
    const filePath = getDataFilePath()
    const data = await fs.readFile(filePath, 'utf-8')
    return JSON.parse(data)
  } catch (error) {
    // If file doesn't exist, return default structure
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      return { workspaces: [], settings: { defaultIDE: 'vscode', theme: 'system' } }
    }
    throw error
  }
})

// Write data to JSON file
ipcMain.handle('write-data', async (_event, data) => {
  try {
    const filePath = getDataFilePath()
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), 'utf-8')
    return { success: true }
  } catch (error) {
    console.error('Error writing data:', error)
    return { success: false, error: (error as Error).message }
  }
})

// Open project in VSCode
ipcMain.handle('open-in-vscode', async (_event, projectPath: string) => {
  try {
    // Try to open with 'code' command
    await execAsync(`code "${projectPath}"`)
    return { success: true }
  } catch (error) {
    console.error('Error opening VSCode:', error)

    // Check if VSCode is installed
    try {
      await execAsync('code --version')
      return {
        success: false,
        error: 'Unable to open VSCode. Please check the project path.'
      }
    } catch {
      return {
        success: false,
        error: 'VSCode not found. Please make sure VSCode is installed and added to PATH.'
      }
    }
  }
})

// Select folder dialog
ipcMain.handle('select-folder', async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ['openDirectory']
    })

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true }
    }

    return {
      canceled: false,
      path: result.filePaths[0]
    }
  } catch (error) {
    console.error('Error selecting folder:', error)
    return {
      canceled: true,
      error: (error as Error).message
    }
  }
})

// Open project in any IDE
ipcMain.handle('open-in-ide', async (_event, projectPath: string, ide: string) => {
  const ideCommands: Record<string, { command: string; name: string }> = {
    vscode: { command: 'code', name: 'Visual Studio Code' },
    cursor: { command: 'cursor', name: 'Cursor' },
    webstorm: { command: 'webstorm', name: 'WebStorm' },
    intellij: { command: 'idea', name: 'IntelliJ IDEA' },
    sublime: { command: 'subl', name: 'Sublime Text' },
    atom: { command: 'atom', name: 'Atom' },
    'notepad++': { command: 'notepad++', name: 'Notepad++' }
  }

  const ideConfig = ideCommands[ide]
  if (!ideConfig) {
    return { success: false, error: 'Unknown IDE' }
  }

  try {
    // Try to open with the IDE command
    await execAsync(`${ideConfig.command} "${projectPath}"`)
    return { success: true }
  } catch (error) {
    console.error(`Error opening ${ideConfig.name}:`, error)

    // Check if IDE is installed
    try {
      await execAsync(`${ideConfig.command} --version`)
      return {
        success: false,
        error: `Unable to open ${ideConfig.name}. Please check the project path.`
      }
    } catch {
      return {
        success: false,
        error: `${ideConfig.name} not found. Please make sure it is installed and added to PATH.`
      }
    }
  }
})

// Check if a path exists
ipcMain.handle('path-exists', async (_event, checkPath: string) => {
  try {
    await fs.access(checkPath)
    return true
  } catch {
    return false
  }
})

// Create a new folder
ipcMain.handle('create-folder', async (_event, folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true })
    return { success: true, path: folderPath }
  } catch (error) {
    console.error('Error creating folder:', error)
    return { success: false, error: (error as Error).message }
  }
})
