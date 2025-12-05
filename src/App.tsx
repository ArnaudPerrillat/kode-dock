import { useEffect, useState } from "react";
import {
  Search,
  Check,
  X,
  Edit2,
  FolderPlus,
  Trash2,
  MoreVertical,
} from "lucide-react";
import { AppData, Project, IDE, Theme } from "@/types";
import { Sidebar } from "@/components/Sidebar";
import { ProjectGrid } from "@/components/ProjectGrid";
import { AddProjectDialog } from "@/components/AddProjectDialog";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import { WorkspaceCreationDialog } from "@/components/WorkspaceCreationDialog";
import { Settings } from "@/components/Settings";
import { ProjectDetails } from "@/components/ProjectDetails";
import { GlobalSearchDialog } from "@/components/GlobalSearchDialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { storage, createWorkspace, createProject } from "@/lib/storage";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "./components/ui/dropdown-menu";

type View = "workspace" | "settings" | "project-details";

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
  const [isWorkspaceCreationDialogOpen, setIsWorkspaceCreationDialogOpen] =
    useState(false);
  const [projectToEdit, setProjectToEdit] = useState<Project | undefined>(
    undefined
  );
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [isEditingWorkspaceName, setIsEditingWorkspaceName] = useState(false);
  const [editingWorkspaceName, setEditingWorkspaceName] = useState("");
  const [projectToDelete, setProjectToDelete] = useState<Project | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<{
    id: string;
    name: string;
    projectCount: number;
  } | null>(null);
  const [selectedProject, setSelectedProject] = useState<Project | null>(null);
  const [isGlobalSearchOpen, setIsGlobalSearchOpen] = useState(false);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

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

  const handleWorkspaceCreateFromFolder = async (
    workspaceName: string,
    selectedFolders: { name: string; path: string }[]
  ) => {
    const newWorkspace = createWorkspace(workspaceName);

    // Create projects from selected folders
    const newProjects = selectedFolders.map((folder) =>
      createProject(folder.name, folder.path)
    );

    newWorkspace.projects = newProjects;

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

  const handleWorkspaceReorder = async (
    workspaceId: string,
    direction: "up" | "down"
  ) => {
    const currentIndex = data.workspaces.findIndex((w) => w.id === workspaceId);
    if (currentIndex === -1) return;

    // Can't move up if already first, can't move down if already last
    if (
      (direction === "up" && currentIndex === 0) ||
      (direction === "down" && currentIndex === data.workspaces.length - 1)
    ) {
      return;
    }

    const newWorkspaces = [...data.workspaces];
    const targetIndex =
      direction === "up" ? currentIndex - 1 : currentIndex + 1;

    // Swap elements
    [newWorkspaces[currentIndex], newWorkspaces[targetIndex]] = [
      newWorkspaces[targetIndex],
      newWorkspaces[currentIndex],
    ];

    await saveData({ workspaces: newWorkspaces, settings: data.settings });
  };

  const handleWorkspaceReorderByIndex = async (
    fromIndex: number,
    toIndex: number
  ) => {
    if (fromIndex === toIndex) return;

    const newWorkspaces = [...data.workspaces];
    const [movedWorkspace] = newWorkspaces.splice(fromIndex, 1);
    newWorkspaces.splice(toIndex, 0, movedWorkspace);

    await saveData({ workspaces: newWorkspaces, settings: data.settings });
  };

  // Project handlers
  const handleProjectAdd = async (
    name: string,
    path: string,
    description: string,
    tags: string[],
    icon: string,
    devServerEnabled: boolean,
    devServerCommand: string,
    openInBrowser: boolean,
    openInTerminal: boolean
  ) => {
    if (!activeWorkspaceId) return;

    const newProject = createProject(
      name,
      path,
      description,
      tags,
      icon,
      devServerEnabled,
      devServerCommand,
      openInBrowser,
      openInTerminal
    );
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
    icon: string,
    devServerEnabled: boolean,
    devServerCommand: string,
    openInBrowser: boolean,
    openInTerminal: boolean
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
                  ? {
                      ...p,
                      name,
                      path,
                      description,
                      tags,
                      icon,
                      devServerEnabled,
                      devServerCommand,
                      openInBrowser,
                      openInTerminal,
                    }
                  : p
              ),
            }
          : w
      ),
    };
    await saveData(newData);
    setProjectToEdit(undefined);
  };

  const handleProjectDelete = (projectId: string) => {
    if (!activeWorkspaceId) return;
    const workspace = data.workspaces.find((w) => w.id === activeWorkspaceId);
    const project = workspace?.projects.find((p) => p.id === projectId);
    if (project) {
      setProjectToDelete(project);
    }
  };

  const confirmProjectDelete = async () => {
    if (!activeWorkspaceId || !projectToDelete) return;

    const newData = {
      ...data,
      workspaces: data.workspaces.map((w) =>
        w.id === activeWorkspaceId
          ? {
              ...w,
              projects: w.projects.filter((p) => p.id !== projectToDelete.id),
            }
          : w
      ),
    };
    await saveData(newData);
    setProjectToDelete(null);
  };

  const confirmWorkspaceDelete = async () => {
    if (!workspaceToDelete) return;
    await handleWorkspaceDelete(workspaceToDelete.id);
    setWorkspaceToDelete(null);
  };

  const handleEditProject = (project: Project) => {
    setProjectToEdit(project);
    setIsAddProjectDialogOpen(true);
  };

  const handleViewProjectDetails = (project: Project) => {
    setSelectedProject(project);
    setActiveView("project-details");
  };

  const handleBackToWorkspace = () => {
    setActiveView("workspace");
    setSelectedProject(null);
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

  // Global search keyboard shortcut (Ctrl+F / Cmd+F)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === "f") {
        e.preventDefault();
        setIsGlobalSearchOpen(true);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

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
        onWorkspaceReorder={handleWorkspaceReorder}
        onWorkspaceReorderByIndex={handleWorkspaceReorderByIndex}
        onSettingsClick={handleSettingsClick}
        isSettingsActive={activeView === "settings"}
        onWorkspaceCreateFromFolder={() =>
          setIsWorkspaceCreationDialogOpen(true)
        }
        isCollapsed={isSidebarCollapsed}
        onToggleCollapse={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
        isMobileOpen={isSidebarOpen}
        onMobileOpenChange={setIsSidebarOpen}
      />

      <main className="flex-1 overflow-hidden flex">
        {activeView === "settings" ? (
          <Settings
            defaultIDE={data.settings.defaultIDE}
            theme={data.settings.theme}
            onIDEChange={handleIDEChange}
            onThemeChange={handleThemeChange}
          />
        ) : activeWorkspace ? (
          <>
            {/* Mobile: Full page project details */}
            {activeView === "project-details" && selectedProject && (
              <div className="lg:hidden w-full overflow-auto">
                <ProjectDetails
                  project={selectedProject}
                  onBack={handleBackToWorkspace}
                  onEdit={handleEditProject}
                  onDelete={handleProjectDelete}
                  defaultIDE={data.settings.defaultIDE}
                />
              </div>
            )}

            {/* Desktop: Project grid + optional side panel */}
            <div
              className={`bg-slate-50 dark:bg-slate-950 h-full overflow-auto transition-all duration-300 ${
                selectedProject && activeView === "project-details"
                  ? "hidden lg:block lg:flex-1"
                  : "flex-1"
              }`}
            >
              <div className="border-b border-border bg-white dark:bg-slate-900">
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
                            if (e.key === "Escape")
                              cancelEditingWorkspaceName();
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
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() =>
                            setWorkspaceToDelete({
                              id: activeWorkspace.id,
                              name: activeWorkspace.name,
                              projectCount: activeWorkspace.projects.length,
                            })
                          }
                          className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    )}
                    {!isEditingWorkspaceName && (
                      <p className="text-xs text-muted-foreground">
                        {activeWorkspace.projects.length} project
                        {activeWorkspace.projects.length !== 1 ? "s" : ""}
                        {searchQuery &&
                          ` · ${filteredProjects.length} matching`}
                      </p>
                    )}
                  </div>
                  <Button onClick={() => setIsAddProjectDialogOpen(true)}>
                    <FolderPlus className="h-4 w-4" strokeWidth={2.5} />
                    Add Project
                  </Button>
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={(e) => e.stopPropagation()}
                        className="ml-2"
                      >
                        <MoreVertical className="h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent
                      align="end"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <DropdownMenuItem
                        onClick={(e) => {
                          e.stopPropagation();
                          setWorkspaceToDelete({
                            id: activeWorkspace.id,
                            name: activeWorkspace.name,
                            projectCount: activeWorkspace.projects.length,
                          });
                        }}
                        className="cursor-pointer text-red-600 focus:text-red-600"
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete workspace
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
                <div className="px-6 pb-6">
                  <div className="relative">
                    <Search className="absolute left-5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      type="text"
                      placeholder="Search projects by name, description, path, or tags..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-11 bg-slate-50 hover:bg-slate-100 dark:bg-slate-800 dark:hover:bg-slate-700 border-0 focus:ring-0 rounded-lg h-12"
                    />
                  </div>
                </div>
              </div>

              <div className="p-6">
                <ProjectGrid
                  projects={filteredProjects}
                  onProjectDelete={handleProjectDelete}
                  onProjectEdit={handleEditProject}
                  onViewDetails={handleViewProjectDetails}
                  onAddProject={() => setIsAddProjectDialogOpen(true)}
                  defaultIDE={data.settings.defaultIDE}
                />
              </div>
            </div>

            {/* Desktop: Side panel for project details */}
            {selectedProject && activeView === "project-details" && (
              <div className="hidden lg:flex lg:flex-col lg:w-1/2 xl:w-2/5 border-l border-border h-full">
                <div className="flex-1 overflow-y-auto">
                  <ProjectDetails
                    project={selectedProject}
                    onBack={handleBackToWorkspace}
                    onEdit={handleEditProject}
                    onDelete={handleProjectDelete}
                    defaultIDE={data.settings.defaultIDE}
                    isSidePanel={true}
                  />
                </div>
              </div>
            )}
          </>
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

      <ConfirmDeleteDialog
        open={projectToDelete !== null}
        onOpenChange={(open) => !open && setProjectToDelete(null)}
        onConfirm={confirmProjectDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone."
        itemName={projectToDelete?.name}
      />

      <ConfirmDeleteDialog
        open={workspaceToDelete !== null}
        onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
        onConfirm={confirmWorkspaceDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete this workspace? This will delete ${
          workspaceToDelete?.projectCount || 0
        } project${
          workspaceToDelete?.projectCount !== 1 ? "s" : ""
        }. This action cannot be undone.`}
        itemName={workspaceToDelete?.name}
      />

      <WorkspaceCreationDialog
        open={isWorkspaceCreationDialogOpen}
        onOpenChange={setIsWorkspaceCreationDialogOpen}
        onWorkspaceCreate={handleWorkspaceCreateFromFolder}
      />

      <GlobalSearchDialog
        open={isGlobalSearchOpen}
        onOpenChange={setIsGlobalSearchOpen}
        workspaces={data.workspaces}
        defaultIDE={data.settings.defaultIDE}
      />
    </div>
  );
}

export default App;
