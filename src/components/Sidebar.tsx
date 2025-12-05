import { useState, useEffect, useRef } from "react";
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Folder,
  FolderTree,
  ChevronLeft,
  ChevronRight,
  Menu,
  MoreVertical,
} from "lucide-react";
import { Workspace } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  onWorkspaceAdd: (name: string) => void;
  onWorkspaceRename: (workspaceId: string, newName: string) => void;
  onWorkspaceDelete: (workspaceId: string) => void;
  onWorkspaceReorder: (workspaceId: string, direction: "up" | "down") => void;
  onWorkspaceReorderByIndex: (fromIndex: number, toIndex: number) => void;
  onSettingsClick: () => void;
  isSettingsActive: boolean;
  onWorkspaceCreateFromFolder: () => void;
  isCollapsed: boolean;
  onToggleCollapse: () => void;
  isMobileOpen: boolean;
  onMobileOpenChange: (open: boolean) => void;
}

export function Sidebar({
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceAdd,
  onWorkspaceRename,
  onWorkspaceDelete,
  onWorkspaceReorderByIndex,
  onSettingsClick,
  isSettingsActive,
  onWorkspaceCreateFromFolder,
  isCollapsed,
  onToggleCollapse,
  isMobileOpen,
  onMobileOpenChange,
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(
    null
  );
  const [openDropdownId, setOpenDropdownId] = useState<string | null>(null);
  const newWorkspaceInputRef = useRef<HTMLInputElement>(null);

  // Focus the input when adding a new workspace
  useEffect(() => {
    if (isAdding && !isCollapsed && newWorkspaceInputRef.current) {
      // Delay to ensure the sidebar has expanded and dropdown has closed
      const timer = setTimeout(() => {
        newWorkspaceInputRef.current?.focus();
        newWorkspaceInputRef.current?.select();
      }, 350);
      return () => clearTimeout(timer);
    }
  }, [isAdding, isCollapsed]);

  const handleAdd = () => {
    if (newWorkspaceName.trim()) {
      onWorkspaceAdd(newWorkspaceName.trim());
      setNewWorkspaceName("");
      setIsAdding(false);
    }
  };

  const handleRename = (workspaceId: string) => {
    if (editingName.trim()) {
      onWorkspaceRename(workspaceId, editingName.trim());
      setEditingId(null);
      setEditingName("");
    }
  };

  const startEdit = (workspace: Workspace) => {
    setEditingId(workspace.id);
    setEditingName(workspace.name);
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditingName("");
  };

  const handleDragStart = (index: number) => {
    setDraggedIndex(index);
  };

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex === null || draggedIndex === dropIndex) {
      setDraggedIndex(null);
      setDragOverIndex(null);
      return;
    }

    onWorkspaceReorderByIndex(draggedIndex, dropIndex);

    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleConfirmDeleteWorkspace = () => {
    if (workspaceToDelete) {
      onWorkspaceDelete(workspaceToDelete.id);
      setWorkspaceToDelete(null);
    }
  };

  const sidebarContent = (
    <>
      <div className={cn("p-4 border-b border-border", isCollapsed && "p-2")}>
        {!isCollapsed ? (
          <div className="flex flex-col">
            <div className="flex items-center gap-2">
              <Logo className="h-4 w-4 text-blue-500" />
              <h1 className="text-lg font-bold">KodeDock</h1>
            </div>
            {/* <p className="text-xs text-muted-foreground">
              Code Projects Manager
            </p> */}
          </div>
        ) : (
          <div className="flex justify-center py-2">
            <Logo className="h-4 w-4 text-blue-500" />
          </div>
        )}
      </div>

      <div
        className={cn("flex-1 overflow-y-auto", isCollapsed ? "p-2" : "p-4")}
      >
        <div
          className={cn(
            "flex items-center mb-3",
            isCollapsed ? "justify-center" : "justify-between"
          )}
        >
          {!isCollapsed && (
            <h2 className="text-xs font-semibold text-muted-foreground uppercase">
              Workspaces
            </h2>
          )}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="ghost" className="h-6 w-6">
                <Plus className="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem
                onClick={() => {
                  if (isCollapsed) {
                    onToggleCollapse();
                  }
                  setIsAdding(true);
                }}
              >
                <Folder className="h-4 w-4 mr-2" />
                New Workspace
              </DropdownMenuItem>
              <DropdownMenuItem onClick={onWorkspaceCreateFromFolder}>
                <FolderTree className="h-4 w-4 mr-2" />
                Create from Folder
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

        <div className="space-y-1">
          {workspaces.map((workspace, index) => {
            const workspaceItem = (
              <div
                key={workspace.id}
                draggable={editingId !== workspace.id}
                onDragStart={() => handleDragStart(index)}
                onDragOver={(e) => handleDragOver(e, index)}
                onDrop={(e) => handleDrop(e, index)}
                onDragEnd={handleDragEnd}
                onClick={() => onWorkspaceSelect(workspace.id)}
                className={cn(
                  "group flex items-center gap-2 rounded-md transition-colors select-none",
                  isCollapsed
                    ? "px-2 py-2 h-10 justify-center"
                    : "px-3 py-2 h-10",
                  activeWorkspaceId === workspace.id
                    ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400"
                    : "hover:bg-accent cursor-pointer",
                  draggedIndex === index && "opacity-50",
                  dragOverIndex === index &&
                    draggedIndex !== index &&
                    "border-t-2 border-blue-500"
                )}
              >
                {editingId === workspace.id ? (
                  <>
                    <Input
                      value={editingName}
                      onChange={(e) => setEditingName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleRename(workspace.id);
                        if (e.key === "Escape") cancelEdit();
                      }}
                      className="h-7 flex-1"
                      autoFocus
                    />
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={() => handleRename(workspace.id)}
                    >
                      <Check className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={cancelEdit}
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </>
                ) : (
                  <>
                    {activeWorkspaceId === workspace.id ? (
                      <FolderOpen className="h-4 w-4 flex-shrink-0" />
                    ) : (
                      <Folder className="h-4 w-4 flex-shrink-0" />
                    )}
                    {!isCollapsed && (
                      <>
                        <span className="flex-1 text-xs truncate">
                          {workspace.name}
                        </span>
                        <span className="text-xs opacity-70">
                          {workspace.projects.length}
                        </span>
                        <div
                          className={cn(
                            "hidden",
                            (openDropdownId === workspace.id || undefined) &&
                              "flex",
                            "group-hover:flex"
                          )}
                        >
                          <DropdownMenu
                            modal={false}
                            onOpenChange={(open) =>
                              setOpenDropdownId(open ? workspace.id : null)
                            }
                          >
                            <DropdownMenuTrigger asChild>
                              <Button
                                size="icon"
                                variant="ghost"
                                className="h-6 w-6"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical className="h-3 w-3" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" side="bottom">
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEdit(workspace);
                                }}
                              >
                                <Edit2 className="h-3 w-3 mr-2" />
                                Rename
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={(e) => {
                                  e.stopPropagation();
                                  setWorkspaceToDelete(workspace);
                                }}
                              >
                                <Trash2 className="h-3 w-3 mr-2" />
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            );

            return isCollapsed && editingId !== workspace.id ? (
              <Tooltip key={workspace.id}>
                <TooltipTrigger asChild>{workspaceItem}</TooltipTrigger>
                <TooltipContent side="right">
                  <p>{workspace.name}</p>
                  <p className="text-xs opacity-70">
                    {workspace.projects.length} projects
                  </p>
                </TooltipContent>
              </Tooltip>
            ) : (
              workspaceItem
            );
          })}

          {isAdding && !isCollapsed && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Input
                ref={newWorkspaceInputRef}
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleAdd();
                  if (e.key === "Escape") {
                    setIsAdding(false);
                    setNewWorkspaceName("");
                  }
                }}
                placeholder="Workspace name"
                className="h-7 flex-1"
                autoFocus
              />
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={handleAdd}
              >
                <Check className="h-3 w-3" />
              </Button>
              <Button
                size="icon"
                variant="ghost"
                className="h-6 w-6"
                onClick={() => {
                  setIsAdding(false);
                  setNewWorkspaceName("");
                }}
              >
                <X className="h-3 w-3" />
              </Button>
            </div>
          )}
        </div>
      </div>

      <div
        className={cn(
          "mt-auto border-t border-border",
          isCollapsed ? "p-2" : "p-4"
        )}
      >
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onSettingsClick}
                className={cn(
                  "w-full font-semibold flex items-center rounded-md transition-colors justify-center px-2 py-2",
                  isSettingsActive
                    ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400"
                    : "hover:bg-accent"
                )}
              >
                <Settings className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Settings</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onSettingsClick}
            className={cn(
              "w-full font-semibold flex items-center rounded-md transition-colors gap-2 px-3 py-2",
              isSettingsActive
                ? "bg-blue-50 text-blue-600 font-medium dark:bg-blue-950 dark:text-blue-400"
                : "hover:bg-accent"
            )}
          >
            <Settings className="h-4 w-4" />
            <span className="text-xs">Settings</span>
          </button>
        )}

        {/* Toggle button */}
        {isCollapsed ? (
          <Tooltip>
            <TooltipTrigger asChild>
              <button
                onClick={onToggleCollapse}
                className="w-full font-semibold flex items-center rounded-md transition-colors mt-2 hover:bg-accent justify-center px-2 py-2"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p>Expand sidebar</p>
            </TooltipContent>
          </Tooltip>
        ) : (
          <button
            onClick={onToggleCollapse}
            className="w-full font-semibold flex items-center rounded-md transition-colors mt-2 hover:bg-accent gap-2 px-3 py-2"
          >
            <ChevronLeft className="h-4 w-4" />
            <span className="text-xs">Collapse</span>
          </button>
        )}
      </div>
    </>
  );

  return (
    <>
      {/* Mobile drawer overlay */}
      {isMobileOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          onClick={() => onMobileOpenChange(false)}
        />
      )}

      {/* Sidebar */}
      <div
        className={cn(
          "bg-white dark:bg-slate-900 border-r border-border h-screen flex flex-col transition-all duration-300",
          // Mobile: drawer behavior
          "fixed md:relative z-50 md:z-0",
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0",
          // Desktop: collapsible sidebar
          isCollapsed ? "md:w-16" : "md:w-72",
          // Mobile: always full width when open
          "w-72"
        )}
      >
        {/* Mobile close button */}
        <Button
          size="icon"
          variant="ghost"
          className="absolute top-4 right-4 md:hidden"
          onClick={() => onMobileOpenChange(false)}
        >
          <X className="h-4 w-4" />
        </Button>

        {sidebarContent}
      </div>

      {/* Mobile menu button */}
      <Button
        size="icon"
        variant="ghost"
        className="fixed top-4 left-4 z-30 md:hidden"
        onClick={() => onMobileOpenChange(true)}
      >
        <Menu className="h-5 w-5" />
      </Button>

      <ConfirmDeleteDialog
        open={workspaceToDelete !== null}
        onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
        onConfirm={handleConfirmDeleteWorkspace}
        title="Delete Workspace"
        description={`Are you sure you want to delete this workspace? This will remove the workspace and all ${
          workspaceToDelete?.projects.length || 0
        } project(s) from KodeDock. Your project files will not be deleted from your disk.`}
        itemName={workspaceToDelete?.name}
      />
    </>
  );
}
