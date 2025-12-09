import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { shell } from "electron";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";
import { ProcessManager } from "./processManager";

const execAsync = promisify(exec);

// Process manager for dev servers
const processManager = new ProcessManager();

let mainWindow: BrowserWindow | null = null;
const isDev = process.env.NODE_ENV === "development" || !app.isPackaged;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    webPreferences: {
      preload: path.join(__dirname, "preload.js"),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
    autoHideMenuBar: true,
    icon: path.join(__dirname, "../build/icon.ico"),
  });

  if (isDev) {
    mainWindow.loadURL("http://localhost:5173");
    mainWindow.webContents.openDevTools();
  } else {
    mainWindow.loadFile(path.join(__dirname, "../dist/index.html"));
  }
}

app.whenReady().then(() => {
  createWindow();

  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});

// Clean up processes before quitting
app.on("before-quit", () => {
  processManager.cleanup();
});

// Get the data file path
function getDataFilePath(): string {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "kodedock-data.json");
}

// IPC Handlers

// Read data from JSON file
ipcMain.handle("read-data", async () => {
  try {
    const filePath = getDataFilePath();
    const data = await fs.readFile(filePath, "utf-8");
    return JSON.parse(data);
  } catch (error) {
    // If file doesn't exist, return default structure
    if ((error as NodeJS.ErrnoException).code === "ENOENT") {
      return {
        workspaces: [],
        settings: { defaultIDE: "vscode", theme: "system" },
      };
    }
    throw error;
  }
});

// Write data to JSON file
ipcMain.handle("write-data", async (_event, data) => {
  try {
    const filePath = getDataFilePath();
    await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf-8");
    return { success: true };
  } catch (error) {
    console.error("Error writing data:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Open project in VSCode
ipcMain.handle("open-in-vscode", async (_event, projectPath: string) => {
  try {
    // Try to open with 'code' command
    await execAsync(`code "${projectPath}"`);
    return { success: true };
  } catch (error) {
    console.error("Error opening VSCode:", error);

    // Check if VSCode is installed
    try {
      await execAsync("code --version");
      return {
        success: false,
        error: "Unable to open VSCode. Please check the project path.",
      };
    } catch {
      return {
        success: false,
        error:
          "VSCode not found. Please make sure VSCode is installed and added to PATH.",
      };
    }
  }
});

// Select folder dialog
ipcMain.handle("select-folder", async () => {
  try {
    const result = await dialog.showOpenDialog({
      properties: ["openDirectory"],
    });

    if (result.canceled || result.filePaths.length === 0) {
      return { canceled: true };
    }

    return {
      canceled: false,
      path: result.filePaths[0],
    };
  } catch (error) {
    console.error("Error selecting folder:", error);
    return {
      canceled: true,
      error: (error as Error).message,
    };
  }
});

// Open project in any IDE
ipcMain.handle(
  "open-in-ide",
  async (_event, projectPath: string, ide: string) => {
    const ideCommands: Record<string, { command: string; name: string }> = {
      vscode: { command: "code", name: "Visual Studio Code" },
      cursor: { command: "cursor", name: "Cursor" },
      webstorm: { command: "webstorm", name: "WebStorm" },
      intellij: { command: "idea", name: "IntelliJ IDEA" },
      sublime: { command: "subl", name: "Sublime Text" },
      atom: { command: "atom", name: "Atom" },
      "notepad++": { command: "notepad++", name: "Notepad++" },
    };

    const ideConfig = ideCommands[ide];
    if (!ideConfig) {
      return { success: false, error: "Unknown IDE" };
    }

    try {
      // Try to open with the IDE command
      await execAsync(`${ideConfig.command} "${projectPath}"`);
      return { success: true };
    } catch (error) {
      console.error(`Error opening ${ideConfig.name}:`, error);

      // Check if IDE is installed
      try {
        await execAsync(`${ideConfig.command} --version`);
        return {
          success: false,
          error: `Unable to open ${ideConfig.name}. Please check the project path.`,
        };
      } catch {
        return {
          success: false,
          error: `${ideConfig.name} not found. Please make sure it is installed and added to PATH.`,
        };
      }
    }
  }
);

// Check if a path exists
ipcMain.handle("path-exists", async (_event, checkPath: string) => {
  try {
    await fs.access(checkPath);
    return true;
  } catch {
    return false;
  }
});

// Create a new folder
ipcMain.handle("create-folder", async (_event, folderPath: string) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return { success: true, path: folderPath };
  } catch (error) {
    console.error("Error creating folder:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Run a command in a project directory (opens in external terminal)
ipcMain.handle(
  "run-command",
  async (_event, projectPath: string, command: string) => {
    try {
      // Determine the platform and construct the appropriate command
      const platform = process.platform;
      let childProcess: ChildProcess;

      if (platform === "win32") {
        // Windows: Open Command Prompt and run the command
        childProcess = spawn(
          "cmd",
          ["/c", `start cmd /K "cd /d "${projectPath}" && ${command}"`],
          {
            shell: true,
            detached: true,
          }
        );
      } else if (platform === "darwin") {
        // macOS: Open Terminal.app and run the command
        const script = `tell application "Terminal" to do script "cd \\"${projectPath}\\" && ${command}"`;
        childProcess = spawn("osascript", ["-e", script], {
          detached: true,
        });
      } else {
        // Linux: Try common terminal emulators
        childProcess = spawn(
          "gnome-terminal",
          [
            "--working-directory=" + projectPath,
            "--",
            "bash",
            "-c",
            `${command}; exec bash`,
          ],
          {
            detached: true,
          }
        );
      }

      // Note: Process tracking is not needed for terminal-launched processes
      // as they run independently in their own terminal window

      // Clean up when process exits (if still accessible)
      childProcess.on("exit", () => {
        // Process has exited
      });

      // Unref so it doesn't keep the app running
      childProcess.unref();

      return { success: true };
    } catch (error) {
      console.error("Error running command:", error);
      return {
        success: false,
        error: `Failed to run command: ${(error as Error).message}`,
      };
    }
  }
);

// Open a URL in the user's default browser
ipcMain.handle("open-url", async (_event, url: string) => {
  try {
    await shell.openExternal(url);
    return { success: true };
  } catch (error) {
    console.error("Error opening URL:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Open a folder in the system's file explorer
ipcMain.handle("open-in-explorer", async (_event, projectPath: string) => {
  try {
    await shell.openPath(projectPath);
    return { success: true };
  } catch (error) {
    console.error("Error opening in explorer:", error);
    return { success: false, error: (error as Error).message };
  }
});

// Read subfolders from a directory
ipcMain.handle("read-subfolders", async (_event, parentPath: string) => {
  try {
    const entries = await fs.readdir(parentPath, { withFileTypes: true });
    const folders = entries
      .filter((entry) => entry.isDirectory())
      .map((entry) => ({
        name: entry.name,
        path: path.join(parentPath, entry.name),
      }))
      .sort((a, b) => a.name.localeCompare(b.name));

    return { success: true, folders };
  } catch (error) {
    console.error("Error reading subfolders:", error);
    return { success: false, error: (error as Error).message, folders: [] };
  }
});

// Run dev server and capture output to extract localhost URL
ipcMain.handle(
  "run-dev-server",
  async (
    _event,
    projectPath: string,
    command: string,
    openInBrowser: boolean = true,
    openInTerminal: boolean = false
  ) => {
    return await processManager.startDevServer(projectPath, command, {
      openInBrowser,
      openInTerminal,
    });
  }
);

// Check if a process is running for a project
ipcMain.handle("is-process-running", async (_event, projectPath: string) => {
  return await processManager.isProcessRunning(projectPath);
});

// Kill a running process for a project
ipcMain.handle("kill-process", async (_event, projectPath: string) => {
  return await processManager.killProcess(projectPath);
});

// Get the URL of a running dev server
ipcMain.handle("get-dev-server-url", async (_event, projectPath: string) => {
  return processManager.getUrl(projectPath);
});
