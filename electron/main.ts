import { app, BrowserWindow, ipcMain, dialog } from "electron";
import { shell } from "electron";
import { exec, spawn, ChildProcess } from "child_process";
import { promisify } from "util";
import path from "path";
import fs from "fs/promises";

const execAsync = promisify(exec);

// Track running processes by project path
const runningProcesses = new Map<string, ChildProcess>();

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

      // Store the process for tracking
      runningProcesses.set(projectPath, childProcess);

      // Clean up when process exits
      childProcess.on("exit", () => {
        runningProcesses.delete(projectPath);
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
  async (_event, projectPath: string, command: string, openInBrowser: boolean = true, openInTerminal: boolean = false) => {
    try {
      // If openInTerminal is true, open a new terminal window with the command
      if (openInTerminal) {
        const platform = process.platform;
        let terminalCommand: string;

        if (platform === 'win32') {
          // Windows: Use start command to open a new cmd window
          terminalCommand = `start cmd /k "cd /d "${projectPath}" && ${command}"`;
          spawn('cmd.exe', ['/c', terminalCommand], { shell: true, detached: true });
        } else if (platform === 'darwin') {
          // macOS: Use osascript to open Terminal.app
          const script = `tell application "Terminal" to do script "cd \\"${projectPath}\\" && ${command}"`;
          spawn('osascript', ['-e', script], { detached: true });
        } else {
          // Linux: Try common terminal emulators
          const terminals = [
            { cmd: 'gnome-terminal', args: ['--working-directory', projectPath, '--', 'bash', '-c', `${command}; exec bash`] },
            { cmd: 'konsole', args: ['--workdir', projectPath, '-e', `bash -c "${command}; exec bash"`] },
            { cmd: 'xterm', args: ['-e', `cd "${projectPath}" && ${command}; bash`] },
          ];

          let launched = false;
          for (const terminal of terminals) {
            try {
              spawn(terminal.cmd, terminal.args, { detached: true });
              launched = true;
              break;
            } catch (err) {
              // Try next terminal
              continue;
            }
          }

          if (!launched) {
            return {
              success: false,
              error: "Could not find a compatible terminal emulator. Please install gnome-terminal, konsole, or xterm.",
            };
          }
        }

        // If openInBrowser is also enabled, spawn a silent background process to detect the URL
        if (openInBrowser) {
          const commandParts = command.split(" ");
          const mainCommand = commandParts[0];
          const args = commandParts.slice(1);

          // Spawn a silent process just for URL detection
          const urlDetectorProcess = spawn(mainCommand, args, {
            cwd: projectPath,
            shell: true,
            detached: false,
            stdio: ["ignore", "pipe", "pipe"],
          });

          let urlFound = false;

          // Multiple regex patterns to catch different URL formats
          const urlPatterns = [
            /https?:\/\/localhost:\d+/gi,
            /https?:\/\/127\.0\.0\.1:\d+/gi,
            /https?:\/\/\[::1\]:\d+/gi,
            /localhost:\d+/gi,
            /127\.0\.0\.1:\d+/gi,
          ];

          const processOutput = (output: string) => {
            if (!urlFound) {
              // Strip ANSI color codes and control characters
              const cleanOutput = output
                .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
                .replace(/\x1B\][^\x07]*\x07/g, '')
                .replace(/[\x00-\x1F\x7F-\x9F]/g, '');

              // Try each pattern to find localhost URL
              for (const pattern of urlPatterns) {
                const matches = cleanOutput.match(pattern);
                if (matches && matches.length > 0) {
                  let localhostUrl = matches[0];

                  // Add http:// if not present
                  if (!localhostUrl.startsWith('http')) {
                    localhostUrl = 'http://' + localhostUrl;
                  }

                  // Remove trailing slash
                  localhostUrl = localhostUrl.replace(/\/$/, '');

                  urlFound = true;
                  console.log(`Dev server URL detected: ${localhostUrl}`);

                  // Open the URL in the default browser
                  shell.openExternal(localhostUrl).catch((err) => {
                    console.error("Error opening browser:", err);
                  });

                  // Kill the detector process since we only needed it for URL detection
                  urlDetectorProcess.kill();
                  break;
                }
              }
            }
          };

          // Listen to stdout
          if (urlDetectorProcess.stdout) {
            urlDetectorProcess.stdout.on("data", (data: Buffer) => {
              processOutput(data.toString());
            });
          }

          // Listen to stderr (many dev servers output to stderr)
          if (urlDetectorProcess.stderr) {
            urlDetectorProcess.stderr.on("data", (data: Buffer) => {
              processOutput(data.toString());
            });
          }

          // Clean up when process exits
          urlDetectorProcess.on("exit", () => {
            // Process exited, no cleanup needed since we're not tracking it
          });

          urlDetectorProcess.on("error", (error) => {
            console.error("URL detector process error:", error);
          });
        }

        return { success: true };
      }

      // Check if there's already a process running for this project
      if (runningProcesses.has(projectPath)) {
        return {
          success: false,
          error: "A dev server is already running for this project",
        };
      }

      // Split command into parts for better compatibility
      const commandParts = command.split(" ");
      const mainCommand = commandParts[0];
      const args = commandParts.slice(1);

      // Spawn the process in the project directory
      const childProcess = spawn(mainCommand, args, {
        cwd: projectPath,
        shell: true,
        detached: false,
        stdio: ["ignore", "pipe", "pipe"],
      });

      if (!childProcess.pid) {
        return {
          success: false,
          error: "Failed to start process - no PID assigned",
        };
      }

      runningProcesses.set(projectPath, childProcess);

      let urlFound = false;

      // Multiple regex patterns to catch different URL formats
      const urlPatterns = [
        /https?:\/\/localhost:\d+/gi,
        /https?:\/\/127\.0\.0\.1:\d+/gi,
        /https?:\/\/\[::1\]:\d+/gi,
        /localhost:\d+/gi,
        /127\.0\.0\.1:\d+/gi,
      ];

      const processOutput = (output: string, source: string) => {
        if (!urlFound) {
          // Strip ANSI color codes and control characters
          const cleanOutput = output
            .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, '')
            .replace(/\x1B\][^\x07]*\x07/g, '')
            .replace(/[\x00-\x1F\x7F-\x9F]/g, '');

          // Try each pattern to find localhost URL
          for (const pattern of urlPatterns) {
            const matches = cleanOutput.match(pattern);
            if (matches && matches.length > 0) {
              let localhostUrl = matches[0];

              // Add http:// if not present
              if (!localhostUrl.startsWith('http')) {
                localhostUrl = 'http://' + localhostUrl;
              }

              // Remove trailing slash
              localhostUrl = localhostUrl.replace(/\/$/, '');

              urlFound = true;
              console.log(`Dev server started at ${localhostUrl}`);

              // Open the URL in the default browser if enabled
              if (openInBrowser) {
                shell.openExternal(localhostUrl).catch((err) => {
                  console.error("Error opening browser:", err);
                });
              }

              break;
            }
          }
        }
      };

      // Listen to stdout
      if (childProcess.stdout) {
        childProcess.stdout.on("data", (data: Buffer) => {
          processOutput(data.toString(), "stdout");
        });
      }

      // Listen to stderr (many dev servers output to stderr)
      if (childProcess.stderr) {
        childProcess.stderr.on("data", (data: Buffer) => {
          processOutput(data.toString(), "stderr");
        });
      }

      // Handle process exit
      childProcess.on("exit", () => {
        runningProcesses.delete(projectPath);
      });

      childProcess.on("error", (error) => {
        console.error("Dev server process error:", error);
        runningProcesses.delete(projectPath);
      });

      return { success: true };
    } catch (error) {
      console.error("Error running dev server:", error);
      return {
        success: false,
        error: `Failed to run dev server: ${(error as Error).message}`,
      };
    }
  }
);

// Check if a process is running for a project
ipcMain.handle("is-process-running", async (_event, projectPath: string) => {
  // Don't just check the map, actually search for running node processes
  const platform = process.platform;

  if (platform === "win32") {
    try {
      // Normalize path for comparison
      const normalizedPath = projectPath.toLowerCase().replace(/\\/g, "/");

      // Use PowerShell to get node processes with command lines (wmic is deprecated)
      const psCommand = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId,CommandLine | ConvertTo-Json`;
      const encoded = Buffer.from(psCommand, "utf16le").toString("base64");
      const { stdout } = await execAsync(
        `powershell -NoProfile -EncodedCommand ${encoded}`,
        {
          maxBuffer: 1024 * 1024 * 10, // 10MB buffer
        }
      );

      let processes: Array<{ ProcessId: number; CommandLine: string }> = [];

      if (stdout.trim()) {
        try {
          const parsed = JSON.parse(stdout);
          // Handle both single object and array responses
          processes = Array.isArray(parsed) ? parsed : [parsed];
        } catch (parseError) {
          console.error("Failed to parse PowerShell output:", parseError);
          return false;
        }
      }

      // Check if any process is running in our project directory
      for (const proc of processes) {
        if (proc && proc.CommandLine) {
          // Normalize command line slashes and case for reliable comparison
          const commandLine = String(proc.CommandLine)
            .toLowerCase()
            .replace(/\\/g, "/");
          if (commandLine.includes(normalizedPath)) {
            return true;
          }
        }
      }

      return false;
    } catch (error) {
      console.error("Error checking process:", error);
      return false;
    }
  } else {
    // On Unix-like systems, use ps to find node processes
    try {
      const { stdout } = await execAsync(
        `ps aux | grep node | grep "${projectPath}"`
      );
      return stdout.trim().length > 0;
    } catch (error) {
      return false;
    }
  }
});

// Kill a running process for a project
ipcMain.handle("kill-process", async (_event, projectPath: string) => {
  try {
    const platform = process.platform;

    if (platform === "win32") {
      // On Windows, use PowerShell to find and kill node processes
      // Normalize path for comparison
      const normalizedPath = projectPath.toLowerCase().replace(/\\/g, "/");

      try {
        // Use PowerShell to get node processes with command lines.
        // Use Get-CimInstance and pass the command via -EncodedCommand to avoid quoting issues
        // when invoking PowerShell from Node.
        const psCommand = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId,CommandLine | ConvertTo-Json`;
        const encoded = Buffer.from(psCommand, "utf16le").toString("base64");
        const { stdout } = await execAsync(
          `powershell -NoProfile -EncodedCommand ${encoded}`,
          {
            maxBuffer: 1024 * 1024 * 10, // 10MB buffer
          }
        );

        console.log("PowerShell output:", stdout.substring(0, 200)); // Log first 200 chars

        let processes: Array<{ ProcessId: number; CommandLine: string }> = [];

        if (stdout.trim()) {
          try {
            const parsed = JSON.parse(stdout);
            // Handle both single object and array responses
            processes = Array.isArray(parsed) ? parsed : [parsed];
          } catch (parseError) {
            console.error("Failed to parse PowerShell output:", parseError);
            return {
              success: false,
              error: "Failed to parse process list",
            };
          }
        }

        const pidsToKill: number[] = [];

        for (const proc of processes) {
          if (proc && proc.ProcessId && proc.CommandLine) {
            // Normalize command line slashes and case for reliable comparison
            const commandLine = String(proc.CommandLine)
              .toLowerCase()
              .replace(/\\/g, "/");
            if (commandLine.includes(normalizedPath)) {
              console.log(
                `Found node process ${proc.ProcessId} for project: ${projectPath}`
              );
              pidsToKill.push(proc.ProcessId);
            }
          }
        }

        if (pidsToKill.length === 0) {
          console.log(`No node processes found for path: ${projectPath}`);
          return {
            success: false,
            error: "No running dev server found for this project",
          };
        }

        // Kill all found processes
        let killedCount = 0;
        for (const pid of pidsToKill) {
          try {
            await execAsync(`taskkill /PID ${pid} /T /F`);
            console.log(`Killed process ${pid}`);
            killedCount++;
          } catch (error) {
            console.log(`Failed to kill process ${pid}:`, error);
          }
        }

        // Remove from our tracking if it exists
        runningProcesses.delete(projectPath);

        if (killedCount > 0) {
          return { success: true };
        } else {
          return {
            success: false,
            error: "Found processes but failed to kill them",
          };
        }
      } catch (error) {
        console.error("Error in PowerShell command:", error);
        return {
          success: false,
          error: `Failed to query processes: ${(error as Error).message}`,
        };
      }
    } else {
      // On Unix-like systems, find and kill node processes
      try {
        const { stdout } = await execAsync(
          `ps aux | grep node | grep "${projectPath}" | grep -v grep`
        );
        const lines = stdout.trim().split("\n");

        if (lines.length === 0 || !stdout.trim()) {
          return {
            success: false,
            error: "No running process found for this project",
          };
        }

        for (const line of lines) {
          const parts = line.trim().split(/\s+/);
          const pid = parts[1];
          if (pid) {
            try {
              await execAsync(`kill -9 ${pid}`);
            } catch (error) {
              console.log(
                `Failed to kill process ${pid}, might already be terminated`
              );
            }
          }
        }

        // Remove from our tracking if it exists
        runningProcesses.delete(projectPath);

        return { success: true };
      } catch (error) {
        // grep returns non-zero exit code if no matches found
        return {
          success: false,
          error: "No running process found for this project",
        };
      }
    }
  } catch (error) {
    console.error("Error killing process:", error);
    return {
      success: false,
      error: `Failed to kill process: ${(error as Error).message}`,
    };
  }
});
