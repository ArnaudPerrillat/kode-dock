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
  icon?: string
): Project {
  return {
    id: generateId(),
    name,
    path,
    description,
    tags,
    createdAt: new Date().toISOString(),
    icon,
  };
}
