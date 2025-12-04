import { useEffect, useState } from "react";
import { Search, Check, X, Edit2, FolderPlus } from "lucide-react";
import { AppData, Project, IDE, Theme } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { ProjectGrid } from "@/components/ProjectGrid";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { Settings } from "@/components/Settings";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage, createWorkspace, createProject } from "@/lib/storage";

type View = "workspace" | "settings";

function App() {
  const [data, setData] = useState<AppData>({
    workspaces: [],
    settings: { defaultIDE: "vscode", theme: "system" },
  });
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(
    null
  );
  const [activeView, setActiveView] = useState<View>("workspace");
  const [isAddProjectDialogOpen, setIsAddProjectDialogOpen] = useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");

  // Load data on mount
  useEffect(() => {
    const loadData = async () => {
      const loadedData = await storage.loadData();
      setData(loadedData);

      // Set first workspace as active if exists
      if (loadedData.workspaces.length > 0) {
        setActiveWorkspaceId(loadedData.workspaces[0].id);
      } else {
        // Create a default workspace if none exist
        const defaultWorkspace = createWorkspace("My Projects");
        const newData = {
          workspaces: [defaultWorkspace],
          settings: data.settings,
        };
        await storage.saveData(newData);
        setData(newData);
        setActiveWorkspaceId(defaultWorkspace.id);
      }

      setIsLoading(false);
    };

    loadData();
  }, []);

  // Save data whenever it changes
  const saveData = async (newData: AppData) => {
    setData(newData);
    await storage.saveData(newData);
  };

  const activeWorkspace = data.workspaces.find(
    (w) => w.id === activeWorkspaceId
  );

  // Filter projects based on search query
  const filteredProjects =
    activeWorkspace?.projects.filter((project) => {
      if (!searchQuery.trim()) return true;

      const query = searchQuery.toLowerCase();
      return (
        project.name.toLowerCase().includes(query) ||
        project.description?.toLowerCase().includes(query) ||
        project.path.toLowerCase().includes(query) ||
        project.tags.some((tag) => tag.toLowerCase().includes(query))
      );
    }) || [];

  // Workspace handlers
  const handleWorkspaceAdd = async (name: string) => {
    const newWorkspace = createWorkspace(name);
    const newData = {
      ...data,
      workspaces: [...data.workspaces, newWorkspace],
    };
    await saveData(newData);
    setActiveWorkspaceId(newWorkspace.id);
  };

  const handleWorkspaceRename = async (
    workspaceId: string,
    newName: string
  ) => {
    const newData = {
      ...data,
      workspaces: data.workspaces.map((w) =>
        w.id === workspaceId ? { ...w, name: newName } : w
      ),
    };
    await saveData(newData);
  };

  const handleWorkspaceDelete = async (workspaceId: string) => {
    const newWorkspaces = data.workspaces.filter((w) => w.id !== workspaceId);

    // If deleting active workspace, switch to another
    if (workspaceId === activeWorkspaceId) {
      setActiveWorkspaceId(
        newWorkspaces.length > 0 ? newWorkspaces[0].id : null
      );
    }

    await saveData({ workspaces: newWorkspaces, settings: data.settings });
  };

  // Project handlers
  const handleProjectAdd = async (
    name: string,
    path: string,
    description: string,
    tags: string[],
    icon: string
  ) => {
    if (!activeWorkspaceId) return;

    const newProject = createProject(name, path, description, tags, icon);
    const newData = {
      ...data,
      workspaces: data.workspaces.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, projects: [...w.projects, newProject] }
          : w
      ),
    };
    await saveData(newData);
  };

  const handleProjectEdit = async (
    projectId: string,
    name: string,
    path: string,
    description: string,
    tags: string[],
    icon: string
  ) => {
    if (!activeWorkspaceId) return;

    const newData = {
      ...data,
      workspaces: data.workspaces.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              projects: w.projects.map((p) =>
                p.id === projectId
                  ? { ...p, name, path, description, tags, icon }
                  : p
              ),
            }
          : w
      ),
    };
    await saveData(newData);
    setProjectToEdit(undefined);
  };

  const handleProjectDelete = async (projectId: string) => {
    if (!activeWorkspaceId) return;

    const newData = {
      ...data,
      workspaces: data.workspaces.map((w) =>
        w.id === activeWorkspaceId
          ? { ...w, projects: w.projects.filter((p) => p.id !== projectId) }
          : w
      ),
    };
    await saveData(newData);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsAddProjectDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setIsAddProjectDialogOpen(open);
    if (!open) {
      setProjectToEdit(undefined);
    }
  };

  const handleSettingsClick = () => {
    setActiveView("settings");
  };

  const handleWorkspaceClick = (workspaceId: string) => {
    setActiveWorkspaceId(workspaceId);
    setActiveView("workspace");
  };

  const handleIDEChange = async (ide: IDE) => {
    const newData = {
      ...data,
      settings: { ...data.settings, defaultIDE: ide },
    };
    await saveData(newData);
  };

  const handleThemeChange = async (theme: Theme) => {
    const newData = {
      ...data,
      settings: { ...data.settings, theme },
    };
    await saveData(newData);
  };

  // Apply theme on mount and when theme changes
  useEffect(() => {
    const applyTheme = () => {
      const theme = data.settings.theme;
      const root = document.documentElement;

      if (theme === "dark") {
        root.classList.add("dark");
      } else if (theme === "light") {
        root.classList.remove("dark");
      } else {
        // System theme
        const prefersDark = window.matchMedia(
          "(prefers-color-scheme: dark)"
        ).matches;
        if (prefersDark) {
          root.classList.add("dark");
        } else {
          root.classList.remove("dark");
        }
      }
    };

    applyTheme();

    // Listen for system theme changes if theme is set to "system"
    if (data.settings.theme === "system") {
      const mediaQuery = window.matchMedia("(prefers-color-scheme: dark)");
      const handleChange = () => applyTheme();
      mediaQuery.addEventListener("change", handleChange);
      return () => mediaQuery.removeEventListener("change", handleChange);
    }
  }, [data.settings.theme]);

  const startEditingWorkspaceName = () => {
    if (activeWorkspace) {
      setEditingWorkspaceName(activeWorkspace.name);
      setIsEditingWorkspaceName(true);
    }
  };

  const saveWorkspaceName = async () => {
    if (activeWorkspaceId && editingWorkspaceName.trim()) {
      await handleWorkspaceRename(
        activeWorkspaceId,
        editingWorkspaceName.trim()
      );
      setIsEditingWorkspaceName(false);
    }
  };

  const cancelEditingWorkspaceName = () => {
    setIsEditingWorkspaceName(false);
    setEditingWorkspaceName("");
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg">Loading...</div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-background text-foreground">
      <Sidebar
        workspaces={data.workspaces}
        activeWorkspaceId={
          activeView === "workspace" ? activeWorkspaceId : null
        }
        onWorkspaceSelect={handleWorkspaceClick}
        onWorkspaceAdd={handleWorkspaceAdd}
        onWorkspaceRename={handleWorkspaceRename}
        onWorkspaceDelete={handleWorkspaceDelete}
        onSettingsClick={handleSettingsClick}
        isSettingsActive={activeView === "settings"}
      />

      <main className="flex-1 overflow-auto">
        {activeView === "settings" ? (
          <Settings
            defaultIDE={data.settings.defaultIDE}
            theme={data.settings.theme}
            onIDEChange={handleIDEChange}
            onThemeChange={handleThemeChange}
          />
        ) : activeWorkspace ? (
          <div className="bg-slate-50 h-full">
            <div className="border-b border-border bg-card">
              <div className="flex items-center justify-between p-6">
                <div className="flex-1">
                  {isEditingWorkspaceName ? (
                    <div className="flex items-center gap-2">
                      <Input
                        type="text"
                        value={editingWorkspaceName}
                        onChange={(e) =>
                          setEditingWorkspaceName(e.target.value)
                        }
                        onKeyDown={(e) => {
                          if (e.key === "Enter") saveWorkspaceName();
                          if (e.key === "Escape") cancelEditingWorkspaceName();
                        }}
                        className="text-xl font-bold h-10 max-w-md"
                        autoFocus
                      />
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={saveWorkspaceName}
                        className="h-8 w-8"
                      >
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={cancelEditingWorkspaceName}
                        className="h-8 w-8"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center gap-2 group">
                      <h2 className="text-xl font-bold">
                        {activeWorkspace.name}
                      </h2>
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={startEditingWorkspaceName}
                        className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Edit2 className="h-4 w-4" />
                      </Button>
                    </div>
                  )}
                  {!isEditingWorkspaceName && (
                    <p className="text-xs text-muted-foreground">
                      {activeWorkspace.projects.length} project
                      {activeWorkspace.projects.length !== 1 ? "s" : ""}
                      {searchQuery && ` · ${filteredProjects.length} matching`}
                    </p>
                  )}
                </div>
                <Button onClick={() => setIsAddProjectDialogOpen(true)}>
                  <FolderPlus
                    className="h-4 w-4"
                    strokeWidth={2.5}
                    color="white"
                  />
                  Add Project
                </Button>
              </div>
              <div className="px-6 pb-6">
                <div className="relative">
                  <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    type="text"
                    placeholder="Search projects by name, description, path, or tags..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-11 bg-slate-100 border-0 focus:ring-0 rounded-lg h-12"
                  />
                </div>
              </div>
            </div>

            <div className="p-6">
              <ProjectGrid
                projects={filteredProjects}
                onProjectDelete={handleProjectDelete}
                onProjectEdit={handleEditProject}
                onAddProject={() => setIsAddProjectDialogOpen(true)}
                defaultIDE={data.settings.defaultIDE}
              />
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-full">
            <div className="text-center space-y-4">
              <div className="text-3xl">🚀</div>
              <h3 className="text-lg font-semibold">No workspace selected</h3>
              <p className="text-sm text-muted-foreground">
                Create a workspace to get started
              </p>
            </div>
          </div>
        )}
      </main>

      <AddProjectDialog
        open={isAddProjectDialogOpen}
        onOpenChange={handleDialogOpenChange}
        onProjectAdd={handleProjectAdd}
        projectToEdit={projectToEdit}
        onProjectEdit={handleProjectEdit}
      />
    </div>
  );
}

export default App;
