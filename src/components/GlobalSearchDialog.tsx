import { useState, useEffect, useRef } from "react";
import { Search, FolderOpen } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Project, Workspace, IDE } from "@/types";
import { storage } from "@/lib/storage";
import { getIcon } from "@/lib/iconMap";

interface GlobalSearchDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  workspaces: Workspace[];
  defaultIDE: IDE;
}

interface SearchResult {
  project: Project;
  workspaceName: string;
  workspaceId: string;
}

export function GlobalSearchDialog({
  open,
  onOpenChange,
  workspaces,
  defaultIDE,
}: GlobalSearchDialogProps) {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const resultsRef = useRef<HTMLDivElement>(null);

  // Search across all workspaces
  const searchResults: SearchResult[] = workspaces.flatMap((workspace) =>
    workspace.projects
      .filter((project) => {
        if (!searchQuery.trim()) return true;

        const query = searchQuery.toLowerCase();
        return (
          project.name.toLowerCase().includes(query) ||
          project.description?.toLowerCase().includes(query) ||
          project.path.toLowerCase().includes(query) ||
          project.tags.some((tag) => tag.toLowerCase().includes(query))
        );
      })
      .map((project) => ({
        project,
        workspaceName: workspace.name,
        workspaceId: workspace.id,
      }))
  );

  // Reset selected index when search results change
  useEffect(() => {
    setSelectedIndex(0);
  }, [searchQuery]);

  // Reset state when dialog opens/closes
  useEffect(() => {
    if (open) {
      setSearchQuery("");
      setSelectedIndex(0);
      // Focus input after a short delay to ensure dialog is mounted
      setTimeout(() => {
        inputRef.current?.focus();
      }, 100);
    }
  }, [open]);

  // Scroll selected item into view
  useEffect(() => {
    if (resultsRef.current) {
      const selectedElement = resultsRef.current.children[
        selectedIndex
      ] as HTMLElement;
      if (selectedElement) {
        selectedElement.scrollIntoView({
          block: "nearest",
          behavior: "smooth",
        });
      }
    }
  }, [selectedIndex]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) =>
        prev < searchResults.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (prev > 0 ? prev - 1 : 0));
    } else if (e.key === "Enter" && searchResults.length > 0) {
      e.preventDefault();
      handleLaunchProject(searchResults[selectedIndex]);
    } else if (e.key === "Escape") {
      e.preventDefault();
      onOpenChange(false);
    }
  };

  const handleLaunchProject = async (result: SearchResult) => {
    const { project } = result;
    await storage.openInIDE(project.path, defaultIDE);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl p-0 gap-0">
        <DialogHeader className="px-6 pt-6 pb-4 border-b">
          <DialogTitle className="text-base font-semibold">
            Quick Launch
          </DialogTitle>
        </DialogHeader>

        <div className="px-6 py-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              ref={inputRef}
              type="text"
              placeholder="Search projects by name, description, path, or tags..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              className="pl-10"
            />
          </div>
        </div>

        <div
          ref={resultsRef}
          className="max-h-[400px] overflow-y-auto px-2 pb-2"
        >
          {searchResults.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              {searchQuery
                ? "No projects found"
                : "Start typing to search projects"}
            </div>
          ) : (
            <div className="space-y-1">
              {searchResults.map((result, index) => (
                <div
                  key={`${result.workspaceId}-${result.project.id}`}
                  className={`flex items-start gap-3 px-4 py-3 rounded-lg cursor-pointer transition-colors ${
                    index === selectedIndex
                      ? "bg-primary/10 border border-primary/20"
                      : "hover:bg-accent border border-transparent"
                  }`}
                  onClick={() => handleLaunchProject(result)}
                  onMouseEnter={() => setSelectedIndex(index)}
                >
                  <div className="flex-shrink-0 mt-1">
                    {result.project.icon ? (
                      (() => {
                        const Icon = getIcon(result.project.icon);
                        return <Icon className="h-4 w-4 shrink-0" />;
                      })()
                    ) : (
                      <FolderOpen className="h-6 w-6 text-muted-foreground" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-sm truncate">
                        {result.project.name}
                      </h3>
                      <Badge
                        variant="outline"
                        className="text-xs flex-shrink-0"
                      >
                        {result.workspaceName}
                      </Badge>
                    </div>

                    {result.project.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-1">
                        {result.project.description}
                      </p>
                    )}

                    <p className="text-xs text-muted-foreground/70 mt-1 truncate">
                      {result.project.path}
                    </p>

                    {result.project.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {result.project.tags.map((tag) => (
                          <Badge
                            key={tag}
                            variant="secondary"
                            className="text-xs px-2 py-0"
                          >
                            {tag}
                          </Badge>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-3 border-t bg-muted/30 text-xs text-muted-foreground">
          <div className="flex items-center justify-between">
            <span>Use ↑↓ to navigate</span>
            <span>Press Enter to open, Esc to close</span>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
