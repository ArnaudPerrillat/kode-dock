import { spawn, exec, ChildProcess } from "child_process";
import { promisify } from "util";
import { shell } from "electron";

const execAsync = promisify(exec);

/**
 * Manages dev server processes with proper tracking and cleanup
 */
export class ProcessManager {
  private processes = new Map<string, ChildProcess>();
  private detectedUrls = new Map<string, string>();
  private urlDetectionTimeout = 30000; // 30 seconds timeout for URL detection

  /**
   * Starts a dev server process
   */
  async startDevServer(
    projectPath: string,
    command: string,
    options: {
      openInBrowser?: boolean;
      openInTerminal?: boolean;
    } = {}
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    const { openInBrowser = true, openInTerminal = false } = options;

    try {
      // Check if already running
      if (this.processes.has(projectPath)) {
        return {
          success: false,
          error: "A dev server is already running for this project",
        };
      }

      if (openInTerminal) {
        // Launch in external terminal
        const result = await this.launchInTerminal(projectPath, command);

        if (!result.success) {
          return result;
        }

        // If browser opening is requested, spawn a background URL detector
        if (openInBrowser) {
          this.detectAndOpenUrl(projectPath, command);
        }

        return { success: true };
      } else {
        // Launch in background and track the process
        return await this.launchInBackground(
          projectPath,
          command,
          openInBrowser
        );
      }
    } catch (error) {
      console.error("Error starting dev server:", error);
      return {
        success: false,
        error: `Failed to start dev server: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Kills a running dev server process
   */
  async killProcess(
    projectPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      // First, try to kill tracked process
      const trackedProcess = this.processes.get(projectPath);
      if (trackedProcess && !trackedProcess.killed) {
        trackedProcess.kill("SIGTERM");
        this.processes.delete(projectPath);
      }

      // Then search for any remaining processes in the system
      const platform = process.platform;

      if (platform === "win32") {
        return await this.killWindowsProcess(projectPath);
      } else {
        return await this.killUnixProcess(projectPath);
      }
    } catch (error) {
      console.error("Error killing process:", error);
      return {
        success: false,
        error: `Failed to kill process: ${(error as Error).message}`,
      };
    }
  }

  /**
   * Checks if a process is running for a project
   */
  async isProcessRunning(projectPath: string): Promise<boolean> {
    // First check tracked processes
    const trackedProcess = this.processes.get(projectPath);
    if (trackedProcess && !trackedProcess.killed) {
      return true;
    }

    // Then check system processes
    const platform = process.platform;

    try {
      if (platform === "win32") {
        return await this.isWindowsProcessRunning(projectPath);
      } else {
        return await this.isUnixProcessRunning(projectPath);
      }
    } catch (error) {
      console.error("Error checking process:", error);
      return false;
    }
  }

  /**
   * Gets the detected URL for a project
   */
  getUrl(projectPath: string): string | undefined {
    return this.detectedUrls.get(projectPath);
  }

  /**
   * Cleans up all tracked processes
   */
  cleanup(): void {
    for (const [path, process] of this.processes.entries()) {
      if (!process.killed) {
        process.kill("SIGTERM");
      }
      this.processes.delete(path);
    }
    this.detectedUrls.clear();
  }

  // Private helper methods

  private async launchInTerminal(
    projectPath: string,
    command: string
  ): Promise<{ success: boolean; error?: string }> {
    const platform = process.platform;

    try {
      if (platform === "win32") {
        // Windows: Open Command Prompt
        spawn(
          "cmd.exe",
          ["/c", `start`, `cmd`, `/K`, `cd /d "${projectPath}" && ${command}`],
          {
            shell: true,
            detached: true,
            stdio: "ignore",
          }
        ).unref();
      } else if (platform === "darwin") {
        // macOS: Open Terminal.app
        const script = `tell application "Terminal" to do script "cd \\"${projectPath}\\" && ${command}"`;
        spawn("osascript", ["-e", script], {
          detached: true,
          stdio: "ignore",
        }).unref();
      } else {
        // Linux: Try common terminal emulators
        const terminals = [
          {
            cmd: "gnome-terminal",
            args: [
              "--working-directory",
              projectPath,
              "--",
              "bash",
              "-c",
              `${command}; exec bash`,
            ],
          },
          {
            cmd: "konsole",
            args: [
              "--workdir",
              projectPath,
              "-e",
              `bash -c "${command}; exec bash"`,
            ],
          },
          {
            cmd: "xterm",
            args: ["-e", `cd "${projectPath}" && ${command}; bash`],
          },
        ];

        let launched = false;
        for (const terminal of terminals) {
          try {
            spawn(terminal.cmd, terminal.args, {
              detached: true,
              stdio: "ignore",
            }).unref();
            launched = true;
            break;
          } catch {
            continue;
          }
        }

        if (!launched) {
          return {
            success: false,
            error:
              "Could not find a compatible terminal emulator. Please install gnome-terminal, konsole, or xterm.",
          };
        }
      }

      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: `Failed to launch terminal: ${(error as Error).message}`,
      };
    }
  }

  private async launchInBackground(
    projectPath: string,
    command: string,
    openInBrowser: boolean
  ): Promise<{ success: boolean; error?: string }> {
    const commandParts = command.split(" ");
    const mainCommand = commandParts[0];
    const args = commandParts.slice(1);

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

    this.processes.set(projectPath, childProcess);

    // Set up URL detection if browser opening is requested
    if (openInBrowser) {
      this.setupUrlDetection(childProcess, projectPath);
    }

    // Handle process exit
    childProcess.on("exit", () => {
      this.processes.delete(projectPath);
      this.detectedUrls.delete(projectPath);
    });

    childProcess.on("error", (error) => {
      console.error("Dev server process error:", error);
      this.processes.delete(projectPath);
      this.detectedUrls.delete(projectPath);
    });

    // Return the URL if already detected synchronously, otherwise it will be detected async
    return { success: true, url: this.detectedUrls.get(projectPath) };
  }

  private detectAndOpenUrl(projectPath: string, command: string): void {
    const commandParts = command.split(" ");
    const mainCommand = commandParts[0];
    const args = commandParts.slice(1);

    // Spawn a temporary process just for URL detection
    const detector = spawn(mainCommand, args, {
      cwd: projectPath,
      shell: true,
      detached: false,
      stdio: ["ignore", "pipe", "pipe"],
    });

    let urlFound = false;
    let timeoutHandle: NodeJS.Timeout | null = null;

    // Set timeout to kill detector if URL not found
    timeoutHandle = setTimeout(() => {
      if (!urlFound && !detector.killed) {
        console.log("URL detection timeout - killing detector process");
        detector.kill("SIGTERM");
      }
    }, this.urlDetectionTimeout);

    const processOutput = (output: string) => {
      if (urlFound) return;

      const url = this.extractUrl(output);
      if (url) {
        urlFound = true;
        console.log(`Dev server URL detected: ${url}`);

        // Store the URL
        this.detectedUrls.set(projectPath, url);

        // Open in browser
        shell.openExternal(url).catch((err) => {
          console.error("Error opening browser:", err);
        });

        // Clean up
        if (timeoutHandle) clearTimeout(timeoutHandle);
        if (!detector.killed) detector.kill("SIGTERM");
      }
    };

    if (detector.stdout) {
      detector.stdout.on("data", (data: Buffer) => {
        processOutput(data.toString());
      });
    }

    if (detector.stderr) {
      detector.stderr.on("data", (data: Buffer) => {
        processOutput(data.toString());
      });
    }

    detector.on("exit", () => {
      if (timeoutHandle) clearTimeout(timeoutHandle);
    });

    detector.on("error", (error) => {
      console.error("URL detector process error:", error);
      if (timeoutHandle) clearTimeout(timeoutHandle);
    });
  }

  private setupUrlDetection(process: ChildProcess, projectPath: string): void {
    let urlFound = false;

    const processOutput = (output: string) => {
      if (urlFound) return;

      const url = this.extractUrl(output);
      if (url) {
        urlFound = true;
        console.log(`Dev server started at ${url}`);

        // Store the URL
        this.detectedUrls.set(projectPath, url);

        // Open in browser
        shell.openExternal(url).catch((err) => {
          console.error("Error opening browser:", err);
        });
      }
    };

    if (process.stdout) {
      process.stdout.on("data", (data: Buffer) => {
        processOutput(data.toString());
      });
    }

    if (process.stderr) {
      process.stderr.on("data", (data: Buffer) => {
        processOutput(data.toString());
      });
    }
  }

  private extractUrl(output: string): string | null {
    // Strip ANSI color codes and control characters
    const cleanOutput = output
      .replace(/\x1B\[[0-9;]*[a-zA-Z]/g, "")
      .replace(/\x1B\][^\x07]*\x07/g, "")
      .replace(/[\x00-\x1F\x7F-\x9F]/g, "");

    // URL patterns to match
    const urlPatterns = [
      /https?:\/\/localhost:\d+/gi,
      /https?:\/\/127\.0\.0\.1:\d+/gi,
      /https?:\/\/\[::1\]:\d+/gi,
      /(?:^|\s)(localhost:\d+)(?:\s|$)/gi,
      /(?:^|\s)(127\.0\.0\.1:\d+)(?:\s|$)/gi,
    ];

    for (const pattern of urlPatterns) {
      const matches = cleanOutput.match(pattern);
      if (matches && matches.length > 0) {
        let url = matches[0].trim();

        // Add http:// if not present
        if (!url.startsWith("http")) {
          url = "http://" + url;
        }

        // Remove trailing slash
        url = url.replace(/\/$/, "");

        return url;
      }
    }

    return null;
  }

  private async killWindowsProcess(
    projectPath: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      const normalizedPath = projectPath.toLowerCase().replace(/\\/g, "/");

      // Use PowerShell to find and kill node processes
      const psCommand = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId,CommandLine | ConvertTo-Json`;
      const encoded = Buffer.from(psCommand, "utf16le").toString("base64");

      const { stdout } = await execAsync(
        `powershell -NoProfile -EncodedCommand ${encoded}`,
        { maxBuffer: 1024 * 1024 * 10 }
      );

      if (!stdout.trim()) {
        return {
          success: false,
          error: "No running dev server found for this project",
        };
      }

      let processes: Array<{ ProcessId: number; CommandLine: string }> = [];

      try {
        const parsed = JSON.parse(stdout);
        processes = Array.isArray(parsed) ? parsed : [parsed];
      } catch (parseError) {
        console.error("Failed to parse PowerShell output:", parseError);
        return {
          success: false,
          error: "Failed to parse process list",
        };
      }

      const pidsToKill: number[] = [];

      for (const proc of processes) {
        if (proc && proc.ProcessId && proc.CommandLine) {
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

      if (killedCount > 0) {
        this.processes.delete(projectPath);
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
  }

  private async killUnixProcess(
    projectPath: string
  ): Promise<{ success: boolean; error?: string }> {
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
            await execAsync(`kill -TERM ${pid}`);
            console.log(`Killed process ${pid}`);
          } catch (error) {
            console.log(
              `Failed to kill process ${pid}, might already be terminated`
            );
          }
        }
      }

      this.processes.delete(projectPath);
      return { success: true };
    } catch (error) {
      return {
        success: false,
        error: "No running process found for this project",
      };
    }
  }

  private async isWindowsProcessRunning(projectPath: string): Promise<boolean> {
    try {
      const normalizedPath = projectPath.toLowerCase().replace(/\\/g, "/");

      const psCommand = `Get-CimInstance Win32_Process -Filter "Name = 'node.exe'" | Select-Object ProcessId,CommandLine | ConvertTo-Json`;
      const encoded = Buffer.from(psCommand, "utf16le").toString("base64");

      const { stdout } = await execAsync(
        `powershell -NoProfile -EncodedCommand ${encoded}`,
        { maxBuffer: 1024 * 1024 * 10 }
      );

      if (!stdout.trim()) {
        return false;
      }

      let processes: Array<{ ProcessId: number; CommandLine: string }> = [];

      try {
        const parsed = JSON.parse(stdout);
        processes = Array.isArray(parsed) ? parsed : [parsed];
      } catch {
        return false;
      }

      for (const proc of processes) {
        if (proc && proc.CommandLine) {
          const commandLine = String(proc.CommandLine)
            .toLowerCase()
            .replace(/\\/g, "/");

          if (commandLine.includes(normalizedPath)) {
            return true;
          }
        }
      }

      return false;
    } catch {
      return false;
    }
  }

  private async isUnixProcessRunning(projectPath: string): Promise<boolean> {
    try {
      const { stdout } = await execAsync(
        `ps aux | grep node | grep "${projectPath}" | grep -v grep`
      );
      return stdout.trim().length > 0;
    } catch {
      return false;
    }
  }
}
