import { useState, useEffect } from "react";
import {
  FolderOpen,
  X,
  FolderPlus,
  AlertCircle,
  Info,
  Palette as PaletteIcon,
  Terminal,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { IconPicker } from "@/components/IconPicker";
import { storage } from "@/lib/storage";
import { Project } from "@/types";

interface AddProjectDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectAdd: (
    name: string,
    path: string,
    description: string,
    tags: string[],
    icon: string,
    devServerEnabled: boolean,
    devServerCommand: string,
    openInBrowser: boolean,
    openInTerminal: boolean
  ) => void;
  projectToEdit?: Project;
  onProjectEdit?: (
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
  ) => void;
}

export function AddProjectDialog({
  open,
  onOpenChange,
  onProjectAdd,
  projectToEdit,
  onProjectEdit,
}: AddProjectDialogProps) {
  const [name, setName] = useState("");
  const [path, setPath] = useState("");
  const [description, setDescription] = useState("");
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState("");
  const [icon, setIcon] = useState("");
  const [devServerEnabled, setDevServerEnabled] = useState(true);
  const [devServerCommand, setDevServerCommand] = useState("npm run dev");
  const [openInBrowser, setOpenInBrowser] = useState(true);
  const [openInTerminal, setOpenInTerminal] = useState(false);
  const [error, setError] = useState<string>("");

  const isEditMode = !!projectToEdit;

  // Initialize form with project data when editing
  useEffect(() => {
    if (projectToEdit) {
      setName(projectToEdit.name);
      setPath(projectToEdit.path);
      setDescription(projectToEdit.description || "");
      setTags(projectToEdit.tags);
      setIcon(projectToEdit.icon || "");
      setDevServerEnabled(projectToEdit.devServerEnabled ?? true);
      setDevServerCommand(projectToEdit.devServerCommand || "npm run dev");
      setOpenInBrowser(projectToEdit.openInBrowser ?? true);
      setOpenInTerminal(projectToEdit.openInTerminal ?? false);
    } else {
      resetForm();
    }
  }, [projectToEdit, open]);

  const resetForm = () => {
    setName("");
    setPath("");
    setDescription("");
    setTags([]);
    setTagInput("");
    setIcon("");
    setDevServerEnabled(true);
    setDevServerCommand("npm run dev");
    setOpenInBrowser(true);
    setOpenInTerminal(false);
    setError("");
  };

  const handleSelectFolder = async () => {
    setError("");
    const result = await storage.selectFolder();
    if (!result.canceled && result.path) {
      setPath(result.path);

      // Auto-fill name from folder if empty
      if (!name) {
        const folderName = result.path.split(/[\\/]/).pop() || "";
        setName(folderName);
      }
    }
  };

  const handleCreateNewProject = async () => {
    if (!name.trim()) {
      setError("Please enter a project name first");
      return;
    }

    setError("");
    const result = await storage.selectFolder();
    if (!result.canceled && result.path) {
      // Create the full path with the project name
      const separator = result.path.includes("\\") ? "\\" : "/";
      const newProjectPath = `${result.path}${separator}${name.trim()}`;

      const createResult = await storage.createFolder(newProjectPath);
      if (createResult.success && createResult.path) {
        setPath(createResult.path);
        setError("");
      } else {
        setError(`Failed to create folder: ${createResult.error}`);
      }
    }
  };

  const handleAddTag = () => {
    const trimmedTag = tagInput.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setTags([...tags, trimmedTag]);
      setTagInput("");
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSubmit = () => {
    if (name.trim() && path.trim()) {
      if (isEditMode && projectToEdit && onProjectEdit) {
        onProjectEdit(
          projectToEdit.id,
          name.trim(),
          path.trim(),
          description.trim(),
          tags,
          icon.trim(),
          devServerEnabled,
          devServerCommand.trim(),
          openInBrowser,
          openInTerminal
        );
      } else {
        onProjectAdd(
          name.trim(),
          path.trim(),
          description.trim(),
          tags,
          icon.trim(),
          devServerEnabled,
          devServerCommand.trim(),
          openInBrowser,
          openInTerminal
        );
      }
      resetForm();
      onOpenChange(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, action: () => void) => {
    if (e.key === "Enter") {
      e.preventDefault();
      action();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle className="text-lg">
            {isEditMode ? "Edit Project" : "Add New Project"}
          </DialogTitle>
          <DialogDescription className="text-xs">
            {isEditMode
              ? "Update the project details below."
              : "Add a new project to your workspace. Fill in the details below."}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="general" className="w-full">
          <TabsList className="grid w-full grid-cols-3 h-12">
            <TabsTrigger
              value="general"
              className="flex items-center gap-2 h-full !shadow-none"
            >
              <Info className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger
              value="development"
              className="flex items-center gap-2 h-full !shadow-none"
            >
              <Terminal className="h-4 w-4" />
              Development
            </TabsTrigger>
            <TabsTrigger
              value="customize"
              className="flex items-center gap-2 h-full !shadow-none"
            >
              <PaletteIcon className="h-4 w-4" />
              Customize
            </TabsTrigger>
          </TabsList>

          <TabsContent value="general" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Project Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="My Awesome Project"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="path">Project Path *</Label>
              <div className="flex gap-2">
                <Input
                  id="path"
                  value={path}
                  onChange={(e) => setPath(e.target.value)}
                  placeholder="C:\Projects\my-project"
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFolder}
                  title="Select existing folder"
                >
                  <FolderOpen className="h-4 w-4" />
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCreateNewProject}
                  title="Create new project folder"
                >
                  <FolderPlus className="h-4 w-4" />
                </Button>
              </div>
              <p className="text-xs text-muted-foreground">
                Select an existing folder or create a new one
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="A brief description of your project..."
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="tags">Tags</Label>
              <div className="flex gap-2">
                <Input
                  id="tags"
                  value={tagInput}
                  onChange={(e) => setTagInput(e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, handleAddTag)}
                  placeholder="Add a tag and press Enter"
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={handleAddTag}>
                  Add
                </Button>
              </div>
              {tags.length > 0 && (
                <div className="flex flex-wrap gap-1 mt-2">
                  {tags.map((tag) => (
                    <Badge key={tag} variant="secondary" className="gap-1">
                      {tag}
                      <button
                        onClick={() => handleRemoveTag(tag)}
                        className="hover:text-destructive"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </Badge>
                  ))}
                </div>
              )}
            </div>
          </TabsContent>

          <TabsContent value="development" className="space-y-4 py-4">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label htmlFor="devServerEnabled">Enable Dev Server</Label>
                  <p className="text-xs text-muted-foreground">
                    Allow starting a development server for this project
                  </p>
                </div>
                <Switch
                  id="devServerEnabled"
                  checked={devServerEnabled}
                  onCheckedChange={setDevServerEnabled}
                />
              </div>

              {devServerEnabled && (
                <>
                  <div className="space-y-2">
                    <Label htmlFor="devServerCommand">Dev Server Command</Label>
                    <Input
                      id="devServerCommand"
                      value={devServerCommand}
                      onChange={(e) => setDevServerCommand(e.target.value)}
                      placeholder="npm run dev"
                    />
                    <p className="text-xs text-muted-foreground">
                      The command to start the development server (e.g., npm run dev, yarn start, pnpm dev)
                    </p>
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="openInBrowser">Open in Browser</Label>
                      <p className="text-xs text-muted-foreground">
                        Automatically open the dev server URL in your browser
                      </p>
                    </div>
                    <Switch
                      id="openInBrowser"
                      checked={openInBrowser}
                      onCheckedChange={setOpenInBrowser}
                    />
                  </div>

                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label htmlFor="openInTerminal">Open in Terminal</Label>
                      <p className="text-xs text-muted-foreground">
                        Open the dev server in a new terminal window for full output visibility
                      </p>
                    </div>
                    <Switch
                      id="openInTerminal"
                      checked={openInTerminal}
                      onCheckedChange={setOpenInTerminal}
                    />
                  </div>
                </>
              )}
            </div>
          </TabsContent>

          <TabsContent value="customize" className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Project Icon</Label>
              <IconPicker value={icon} onChange={setIcon} />
              <p className="text-xs text-muted-foreground">
                Choose an icon to easily identify your project
              </p>
            </div>
          </TabsContent>
        </Tabs>

        {error && (
          <div className="flex items-start gap-2 px-6 py-3 text-sm text-destructive bg-destructive/10 rounded-md">
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
            onClick={handleSubmit}
            disabled={!name.trim() || !path.trim()}
          >
            {isEditMode ? "Save Changes" : "Add Project"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
