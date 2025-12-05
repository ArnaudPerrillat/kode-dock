import { useState } from "react";
import { FolderOpen, AlertCircle, Loader2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { storage } from "@/lib/storage";

interface SubfolderItem {
  name: string;
  path: string;
  selected: boolean;
}

interface WorkspaceCreationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onWorkspaceCreate: (
    workspaceName: string,
    selectedFolders: { name: string; path: string }[]
  ) => void;
}

export function WorkspaceCreationDialog({
  open,
  onOpenChange,
  onWorkspaceCreate,
}: WorkspaceCreationDialogProps) {
  const [workspaceName, setWorkspaceName] = useState("");
  const [parentPath, setParentPath] = useState("");
  const [subfolders, setSubfolders] = useState<SubfolderItem[]>([]);
  const [isLoadingFolders, setIsLoadingFolders] = useState(false);
  const [error, setError] = useState<string>("");

  const resetForm = () => {
    setWorkspaceName("");
    setParentPath("");
    setSubfolders([]);
    setError("");
  };

  const handleSelectParentFolder = async () => {
    setError("");
    setIsLoadingFolders(true);

    const result = await storage.selectFolder();
    if (!result.canceled && result.path) {
      setParentPath(result.path);

      // Auto-fill workspace name from folder if empty
      if (!workspaceName) {
        const folderName = result.path.split(/[\\/]/).pop() || "";
        setWorkspaceName(folderName);
      }

      // Read subfolders
      const subfoldersResult = await storage.readSubfolders(result.path);
      if (subfoldersResult.success) {
        setSubfolders(
          subfoldersResult.folders.map((folder) => ({
            ...folder,
            selected: false,
          }))
        );

        if (subfoldersResult.folders.length === 0) {
          setError("No subfolders found in the selected directory");
        }
      } else {
        setError(
          subfoldersResult.error || "Failed to read subfolders from directory"
        );
      }
    }

    setIsLoadingFolders(false);
  };

  const handleToggleFolder = (index: number) => {
    setSubfolders((prev) =>
      prev.map((folder, i) =>
        i === index ? { ...folder, selected: !folder.selected } : folder
      )
    );
  };

  const handleToggleAll = () => {
    const allSelected = subfolders.every((f) => f.selected);
    setSubfolders((prev) =>
      prev.map((folder) => ({ ...folder, selected: !allSelected }))
    );
  };

  const handleCreate = () => {
    const selectedFolders = subfolders
      .filter((f) => f.selected)
      .map(({ name, path }) => ({ name, path }));

    if (!workspaceName.trim()) {
      setError("Please enter a workspace name");
      return;
    }

    if (selectedFolders.length === 0) {
      setError("Please select at least one subfolder to add as a project");
      return;
    }

    onWorkspaceCreate(workspaceName.trim(), selectedFolders);
    resetForm();
    onOpenChange(false);
  };

  const selectedCount = subfolders.filter((f) => f.selected).length;
  const allSelected =
    subfolders.length > 0 && subfolders.every((f) => f.selected);

  return (
    <Dialog
      open={open}
      onOpenChange={(open) => {
        if (!open) resetForm();
        onOpenChange(open);
      }}
    >
      <DialogContent className="sm:max-w-[600px] max-h-[80vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-lg">
            Create Workspace from Folder
          </DialogTitle>
          <DialogDescription className="text-xs">
            Select a parent folder and choose which subfolders to add as
            projects in your new workspace.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 flex-1 py-4">
          <div className="space-y-2">
            <Label htmlFor="workspace-name">Workspace Name *</Label>
            <Input
              id="workspace-name"
              value={workspaceName}
              onChange={(e) => setWorkspaceName(e.target.value)}
              placeholder="My Workspace"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="parent-path">Parent Folder *</Label>
            <div className="flex gap-2">
              <Input
                id="parent-path"
                value={parentPath}
                readOnly
                placeholder="Select a parent folder..."
                className="flex-1 cursor-pointer"
                onClick={handleSelectParentFolder}
              />
              <Button
                type="button"
                variant="outline"
                onClick={handleSelectParentFolder}
                disabled={isLoadingFolders}
              >
                {isLoadingFolders ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <FolderOpen className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Choose a folder containing your projects as subfolders
            </p>
          </div>

          {subfolders.length > 0 && (
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Select Projects ({selectedCount} selected)</Label>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleToggleAll}
                  className="h-7 text-xs"
                >
                  {allSelected ? "Deselect All" : "Select All"}
                </Button>
              </div>
              <div className="border rounded-md max-h-[300px] overflow-y-auto">
                {subfolders.map((folder, index) => (
                  <div
                    key={folder.path}
                    className="flex items-center gap-3 px-4 py-3 hover:bg-muted/50 cursor-pointer border-b last:border-b-0"
                    onClick={() => handleToggleFolder(index)}
                  >
                    <Checkbox
                      checked={folder.selected}
                      onCheckedChange={() => handleToggleFolder(index)}
                      onClick={(e) => e.stopPropagation()}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">
                        {folder.name}
                      </p>
                      <p className="text-xs text-muted-foreground truncate">
                        {folder.path}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>

        {error && (
          <div className="flex items-start gap-2 px-4 py-3 text-sm text-destructive bg-destructive/10 rounded-md">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            onClick={() => {
              resetForm();
              onOpenChange(false);
            }}
          >
            Cancel
          </Button>
          <Button
            onClick={handleCreate}
            disabled={
              !workspaceName.trim() ||
              !parentPath ||
              subfolders.length === 0 ||
              selectedCount === 0
            }
          >
            Create Workspace
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
