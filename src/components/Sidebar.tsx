import { useState } from "react";
import {
  Plus,
  FolderOpen,
  Trash2,
  Edit2,
  Check,
  X,
  Settings,
  Folder,
} from "lucide-react";
import { Workspace } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface SidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null;
  onWorkspaceSelect: (workspaceId: string) => void;
  onWorkspaceAdd: (name: string) => void;
  onWorkspaceRename: (workspaceId: string, newName: string) => void;
  onWorkspaceDelete: (workspaceId: string) => void;
  onSettingsClick: () => void;
  isSettingsActive: boolean;
}

export function Sidebar({
  workspaces,
  activeWorkspaceId,
  onWorkspaceSelect,
  onWorkspaceAdd,
  onWorkspaceRename,
  onWorkspaceDelete,
  onSettingsClick,
  isSettingsActive,
}: SidebarProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState("");

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

  return (
    <div className="w-72 bg-card border-r border-border h-screen flex flex-col">
      <div className="p-4 border-b border-border">
        <h1 className="text-xl font-bold ">KodeDock</h1>
        <p className="text-xs text-muted-foreground">Code Projects Manager</p>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase">
            Workspaces
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setIsAdding(true)}
          >
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <div className="space-y-1">
          {workspaces.map((workspace) => (
            <div
              key={workspace.id}
              onClick={() => onWorkspaceSelect(workspace.id)}
              className={cn(
                "group flex items-center gap-2 px-3 py-2 h-10 rounded-md transition-colors select-none",
                activeWorkspaceId === workspace.id
                  ? "bg-blue-50 text-blue-600 font-medium"
                  : "hover:bg-accent cursor-pointer"
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
                  <span className="flex-1 text-xs truncate">
                    {workspace.name}
                  </span>
                  <span className="text-xs opacity-70">
                    {workspace.projects.length}
                  </span>
                  <div className="hidden group-hover:flex gap-1">
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        startEdit(workspace);
                      }}
                    >
                      <Edit2 className="h-3 w-3" />
                    </Button>
                    <Button
                      size="icon"
                      variant="ghost"
                      className="h-6 w-6"
                      onClick={(e) => {
                        e.stopPropagation();
                        onWorkspaceDelete(workspace.id);
                      }}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </>
              )}
            </div>
          ))}

          {isAdding && (
            <div className="flex items-center gap-2 px-3 py-2">
              <Input
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

      <div className="mt-auto p-4 border-t border-border">
        <button
          onClick={onSettingsClick}
          className={cn(
            "w-full font-semibold flex items-center gap-2 px-3 py-2 rounded-md transition-colors",
            isSettingsActive
              ? "bg-blue-50 text-blue-600 font-medium"
              : "hover:bg-accent"
          )}
        >
          <Settings className="h-4 w-4" />
          <span className="text-xs">Settings</span>
        </button>
      </div>
    </div>
  );
}
