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
  MoreVertical,
} from "lucide-react";
import { Workspace } from "@/types";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { Logo } from "@/components/Logo";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";
import {
  Sidebar as ShadcnSidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuAction,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarRail,
} from "@/components/ui/sidebar";

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  onWorkspaceAdd: (name: string) => void;
  onWorkspaceRename: (workspaceId: string, newName: string) => void;
  onWorkspaceDelete: (workspaceId: string) => void;
  onWorkspaceReorderByIndex: (fromIndex: number, toIndex: number) => void;
  onSettingsClick: () => void;
  isSettingsActive: boolean;
  onWorkspaceCreateFromFolder: () => void;
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
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");
  const [draggedIndex, setDraggedIndex] = useState<number | null>(null);
  const [dragOverIndex, setDragOverIndex] = useState<number | null>(null);
  const [workspaceToDelete, setWorkspaceToDelete] = useState<Workspace | null>(null);
  const [addDropdownOpen, setAddDropdownOpen] = useState(false);
  const newWorkspaceInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isAdding && newWorkspaceInputRef.current) {
      const timer = setTimeout(() => {
        newWorkspaceInputRef.current?.focus();
        newWorkspaceInputRef.current?.select();
      }, 50);
      return () => clearTimeout(timer);
    }
  }, [isAdding]);

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

  const handleDragStart = (index: number) => setDraggedIndex(index);

  const handleDragOver = (e: React.DragEvent, index: number) => {
    e.preventDefault();
    setDragOverIndex(index);
  };

  const handleDrop = (e: React.DragEvent, dropIndex: number) => {
    e.preventDefault();
    if (draggedIndex !== null && draggedIndex !== dropIndex) {
      onWorkspaceReorderByIndex(draggedIndex, dropIndex);
    }
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleDragEnd = () => {
    setDraggedIndex(null);
    setDragOverIndex(null);
  };

  const handleConfirmDelete = () => {
    if (workspaceToDelete) {
      onWorkspaceDelete(workspaceToDelete.id);
      setWorkspaceToDelete(null);
    }
  };

  return (
    <>
      <ShadcnSidebar collapsible="icon">
        {/* Header: Logo + App name */}
        <SidebarHeader>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="data-[slot=sidebar-menu-button]:!p-1.5"
                tooltip="KodeDock"
              >
                <Logo className="h-5 w-5 text-blue-500 shrink-0" />
                <span className="font-bold text-base">KodeDock</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        {/* Workspaces */}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Workspaces</SidebarGroupLabel>

            {/* Add workspace dropdown */}
            <DropdownMenu open={addDropdownOpen} onOpenChange={setAddDropdownOpen}>
              <DropdownMenuTrigger asChild>
                <SidebarGroupAction title="Add Workspace">
                  <Plus />
                  <span className="sr-only">Add Workspace</span>
                </SidebarGroupAction>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="start" side="bottom">
                <DropdownMenuItem
                  onClick={() => {
                    setAddDropdownOpen(false);
                    setIsAdding(true);
                  }}
                >
                  <Folder className="h-4 w-4 mr-2" />
                  New Workspace
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => {
                    setAddDropdownOpen(false);
                    onWorkspaceCreateFromFolder();
                  }}
                >
                  <FolderTree className="h-4 w-4 mr-2" />
                  Create from Folder
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

            <SidebarGroupContent>
              <SidebarMenu>
                {workspaces.map((workspace, index) => {
                  const isActive = activeWorkspaceId === workspace.id;
                  const isEditing = editingId === workspace.id;

                  return (
                    <SidebarMenuItem
                      key={workspace.id}
                      draggable={!isEditing}
                      onDragStart={() => handleDragStart(index)}
                      onDragOver={(e) => handleDragOver(e, index)}
                      onDrop={(e) => handleDrop(e, index)}
                      onDragEnd={handleDragEnd}
                      className={cn(
                        draggedIndex === index && "opacity-50",
                        dragOverIndex === index &&
                          draggedIndex !== index &&
                          "border-t-2 border-blue-500"
                      )}
                    >
                      {isEditing ? (
                        <div className="flex items-center gap-1 px-2 py-1">
                          <Input
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter") handleRename(workspace.id);
                              if (e.key === "Escape") cancelEdit();
                            }}
                            className="h-7 flex-1 text-xs"
                            autoFocus
                          />
                          <button
                            onClick={() => handleRename(workspace.id)}
                            className="p-1 rounded hover:bg-sidebar-accent"
                          >
                            <Check className="h-3 w-3" />
                          </button>
                          <button
                            onClick={cancelEdit}
                            className="p-1 rounded hover:bg-sidebar-accent"
                          >
                            <X className="h-3 w-3" />
                          </button>
                        </div>
                      ) : (
                        <>
                          <SidebarMenuButton
                            isActive={isActive}
                            onClick={() => onWorkspaceSelect(workspace.id)}
                            tooltip={workspace.name}
                            className={cn(
                              isActive &&
                                "data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-400"
                            )}
                          >
                            {isActive ? (
                              <FolderOpen className="shrink-0" />
                            ) : (
                              <Folder className="shrink-0" />
                            )}
                            <span>{workspace.name}</span>
                          </SidebarMenuButton>

                          <SidebarMenuBadge>
                            {workspace.projects.length}
                          </SidebarMenuBadge>

                          {/* Three-dot menu for rename/delete */}
                          <DropdownMenu modal={false}>
                            <DropdownMenuTrigger asChild>
                              <SidebarMenuAction
                                showOnHover
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MoreVertical />
                                <span className="sr-only">More</span>
                              </SidebarMenuAction>
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
                        </>
                      )}
                    </SidebarMenuItem>
                  );
                })}

                {/* New workspace inline input */}
                {isAdding && (
                  <SidebarMenuItem>
                    <div className="flex items-center gap-1 px-2 py-1">
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
                        className="h-7 flex-1 text-xs"
                      />
                      <button
                        onClick={handleAdd}
                        className="p-1 rounded hover:bg-sidebar-accent"
                      >
                        <Check className="h-3 w-3" />
                      </button>
                      <button
                        onClick={() => {
                          setIsAdding(false);
                          setNewWorkspaceName("");
                        }}
                        className="p-1 rounded hover:bg-sidebar-accent"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  </SidebarMenuItem>
                )}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        {/* Footer: Settings */}
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                isActive={isSettingsActive}
                onClick={onSettingsClick}
                tooltip="Settings"
                className={cn(
                  isSettingsActive &&
                    "data-[active=true]:bg-blue-50 data-[active=true]:text-blue-600 dark:data-[active=true]:bg-blue-950/50 dark:data-[active=true]:text-blue-400"
                )}
              >
                <Settings className="shrink-0" />
                <span>Settings</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>

        <SidebarRail />
      </ShadcnSidebar>

      <ConfirmDeleteDialog
        open={workspaceToDelete !== null}
        onOpenChange={(open) => !open && setWorkspaceToDelete(null)}
        onConfirm={handleConfirmDelete}
        title="Delete Workspace"
        description={`Are you sure you want to delete this workspace? This will remove the workspace and all ${
          workspaceToDelete?.projects.length || 0
        } project(s) from KodeDock. Your project files will not be deleted from your disk.`}
        itemName={workspaceToDelete?.name}
      />
    </>
  );
}
