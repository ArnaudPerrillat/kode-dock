import { AppData, Workspace, Project, IDE } from "@/types";

const api = window.electronAPI;

export const storage = {
  async loadData(): Promise<AppData> {
    try {
      const data = await api.readData();
      // Ensure settings exist with default values
      if (!data.settings) {
        data.settings = { defaultIDE: "vscode", theme: "system" };
      }
      // Ensure theme exists in settings for backward compatibility
      if (!data.settings.theme) {
        data.settings.theme = "system";
      }
      return data;
    } catch (error) {
      console.error("Failed to load data:", error);
      return {
        workspaces: [],
        settings: { defaultIDE: "vscode", theme: "system" },
      };
    }
  },

  async saveData(data: AppData): Promise<boolean> {
    try {
      const result = await api.writeData(data);
      return result.success;
    } catch (error) {
      console.error("Failed to save data:", error);
      return false;
    }
  },

  async openInVSCode(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.openInVSCode(path);
    } catch (error) {
      return { success: false, error: "Failed to open VSCode" };
    }
  },

  async openInIDE(
    path: string,
    ide: IDE
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.openInIDE(path, ide);
    } catch (error) {
      return { success: false, error: `Failed to open ${ide}` };
    }
  },

  async selectFolder(): Promise<{
    canceled: boolean;
    path?: string;
    error?: string;
  }> {
    try {
      return await api.selectFolder();
    } catch (error) {
      return { canceled: true, error: "Failed to open folder picker" };
    }
  },

  async pathExists(path: string): Promise<boolean> {
    try {
      return await api.pathExists(path);
    } catch (error) {
      return false;
    }
  },

  async createFolder(
    path: string
  ): Promise<{ success: boolean; path?: string; error?: string }> {
    try {
      return await api.createFolder(path);
    } catch (error) {
      return { success: false, error: "Failed to create folder" };
    }
  },

  async runCommand(
    path: string,
    command: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.runCommand(path, command);
    } catch (error) {
      return { success: false, error: "Failed to run command" };
    }
  },

  async runDevServer(
    path: string,
    command: string,
    openInBrowser: boolean = true,
    openInTerminal: boolean = false
  ): Promise<{ success: boolean; error?: string; url?: string }> {
    try {
      return await api.runDevServer(path, command, openInBrowser, openInTerminal);
    } catch (error) {
      return { success: false, error: "Failed to start dev server" };
    }
  },

  async isProcessRunning(path: string): Promise<boolean> {
    try {
      return await api.isProcessRunning(path);
    } catch (error) {
      return false;
    }
  },

  async killProcess(
    path: string
  ): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.killProcess(path);
    } catch (error) {
      return { success: false, error: "Failed to kill process" };
    }
  },

  async getDevServerUrl(path: string): Promise<string | undefined> {
    try {
      return await api.getDevServerUrl(path);
    } catch (error) {
      return undefined;
    }
  },
  async openUrl(url: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.openUrl(url);
    } catch (error) {
      return { success: false, error: "Failed to open URL" };
    }
  },

  async openInExplorer(path: string): Promise<{ success: boolean; error?: string }> {
    try {
      return await api.openInExplorer(path);
    } catch (error) {
      return { success: false, error: "Failed to open in file explorer" };
    }
  },

  async readSubfolders(parentPath: string): Promise<{
    success: boolean;
    folders: { name: string; path: string }[];
    error?: string;
  }> {
    try {
      return await api.readSubfolders(parentPath);
    } catch (error) {
      return { success: false, folders: [], error: "Failed to read subfolders" };
    }
  },
};

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

export function createWorkspace(name: string): Workspace {
  return {
    id: generateId(),
    name,
    projects: [],
  };
}

export function createProject(
  name: string,
  path: string,
  description?: string,
  tags: string[] = [],
  icon?: string,
  devServerEnabled: boolean = true,
  devServerCommand: string = "npm run dev",
  openInBrowser: boolean = true,
  openInTerminal: boolean = false
): Project {
  return {
    id: generateId(),
    name,
    path,
    description,
    tags,
    createdAt: new Date().toISOString(),
    icon,
    devServerEnabled,
    devServerCommand,
    openInBrowser,
    openInTerminal,
  };
}
