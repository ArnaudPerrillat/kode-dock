import { useState, useEffect } from "react";
import {
  FolderOpen,
  Trash2,
  Calendar,
  AlertCircle,
  Edit2,
  Play,
  Square,
  MoreVertical,
  Info,
  Code2,
  ExternalLink,
} from "lucide-react";
import { Project, IDE } from "@/types";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { storage } from "@/lib/storage";
import { getIcon } from "@/lib/iconMap";
import { ConfirmDeleteDialog } from "@/components/ConfirmDeleteDialog";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onEdit: (project: Project) => void;
  onViewDetails: (project: Project) => void;
  defaultIDE: IDE;
}

export function ProjectCard({
  project,
  onDelete,
  onEdit,
  onViewDetails,
  defaultIDE,
}: ProjectCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [commandAction, setCommandAction] = useState<
    "starting" | "stopping" | null
  >(null);
  const [isProcessRunning, setIsProcessRunning] = useState(false);
  const [devServerUrl, setDevServerUrl] = useState<string | undefined>();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  // Check if process is running on mount and fetch URL
  useEffect(() => {
    const checkProcess = async () => {
      const running = await storage.isProcessRunning(project.path);
      setIsProcessRunning(running);

      if (running) {
        const url = await storage.getDevServerUrl(project.path);
        setDevServerUrl(url);
      }
    };
    checkProcess();
  }, [project.path]);

  const handleOpenInIDE = async () => {
    setIsOpening(true);
    setError(null);

    const result = await storage.openInIDE(project.path, defaultIDE);

    if (!result.success) {
      setError(result.error || "Failed to open IDE");
    }

    setIsOpening(false);
  };

  const handleRunDevServer = async () => {
    setIsRunningCommand(true);
    setCommandAction("starting");
    setError(null);

    const command = project.devServerCommand || "npm run dev";
    const openInBrowser = project.openInBrowser ?? true;
    const openInTerminal = project.openInTerminal ?? false;

    // Start both the operation and a minimum display timer
    const [result] = await Promise.all([
      storage.runDevServer(
        project.path,
        command,
        openInBrowser,
        openInTerminal
      ),
      new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms display time
    ]);

    if (!result.success) {
      setError(result.error || "Failed to start dev server");
      setIsRunningCommand(false);
      setCommandAction(null);
    } else {
      // Process started successfully - the URL will be auto-detected and opened (if not in terminal mode)
      setIsProcessRunning(true);
      setDevServerUrl(result.url);

      // Poll for URL if not immediately available
      if (!result.url) {
        const pollUrl = async () => {
          for (let i = 0; i < 60; i++) {
            // Poll for up to 30 seconds
            await new Promise((resolve) => setTimeout(resolve, 500));
            const url = await storage.getDevServerUrl(project.path);
            if (url) {
              setDevServerUrl(url);
              break;
            }
          }
        };
        pollUrl();
      }

      setIsRunningCommand(false);
      setCommandAction(null);
    }
  };

  const handleStopDevServer = async () => {
    setIsRunningCommand(true);
    setCommandAction("stopping");
    setError(null);

    // Start both the operation and a minimum display timer
    const [result] = await Promise.all([
      storage.killProcess(project.path),
      new Promise((resolve) => setTimeout(resolve, 500)), // Minimum 500ms display time
    ]);

    if (!result.success) {
      setError(result.error || "Failed to stop dev server");
      setIsRunningCommand(false);
      setCommandAction(null);
    } else {
      setIsProcessRunning(false);
      setDevServerUrl(undefined);
      setIsRunningCommand(false);
      setCommandAction(null);
    }
  };

  const handleConfirmDelete = () => {
    onDelete(project.id);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  return (
    <>
      <Card
        className="group hover:shadow-xl dark:bg-slate-900 hover:shadow-slate-200/30 dark:hover:shadow-slate-950/30 transition-shadow duration-200 cursor-pointer shadow-none border-slate-100 dark:border-slate-950"
        onClick={handleOpenInIDE}
      >
      <CardHeader className="relative">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <CardTitle className="text-base flex items-center gap-2">
                {project.icon ? (
                  (() => {
                    const Icon = getIcon(project.icon);
                    return <Icon className="h-4 w-4 shrink-0" />;
                  })()
                ) : (
                  <FolderOpen className="h-4 w-4 shrink-0" />
                )}
                {project.name}
              </CardTitle>
              {isProcessRunning && (
                <Badge
                  variant="secondary"
                  className="bg-green-100 text-green-700 border-green-300 text-xs px-1.5 py-0"
                >
                  Running
                </Badge>
              )}
            </div>
            {project.description && (
              <CardDescription className="mt-2 text-xs">
                {project.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1 shrink-0 absolute top-5 right-5">
            {(project.devServerEnabled ?? true) &&
              (isProcessRunning ? (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleStopDevServer();
                  }}
                  disabled={isRunningCommand}
                  title="Stop dev server"
                  className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                >
                  <Square className="h-4 w-4 fill-current" />
                </Button>
              ) : (
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleRunDevServer();
                  }}
                  disabled={isRunningCommand}
                  title="Start dev server"
                  className="h-8 w-8 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <Play className="h-4 w-4" />
                </Button>
              ))}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={(e) => e.stopPropagation()}
                  className="h-8 w-8"
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
                    onViewDetails(project);
                  }}
                  className="cursor-pointer"
                >
                  <Info className="h-4 w-4 mr-2" />
                  View Details
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    onEdit(project);
                  }}
                  className="cursor-pointer"
                >
                  <Edit2 className="h-4 w-4 mr-2" />
                  Edit
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.stopPropagation();
                    setShowDeleteConfirm(true);
                  }}
                  className="cursor-pointer text-red-600 focus:text-red-600"
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </CardHeader>

      <CardContent>
        <div className="space-y-3">
          <div className="text-xs text-muted-foreground font-mono bg-muted px-2 py-1 rounded truncate">
            {project.path}
          </div>

          {project.tags.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {project.tags.map((tag, index) => (
                <Badge key={index} variant="secondary">
                  {tag}
                </Badge>
              ))}
            </div>
          )}

          <div className="flex items-center gap-1 text-xs text-muted-foreground">
            <Calendar className="h-3 w-3" />
            {formatDate(project.createdAt)}
          </div>

          {error && (
            <div className="flex items-start gap-2 text-xs text-destructive bg-destructive/10 px-2 py-1.5 rounded">
              <AlertCircle className="h-3 w-3 mt-0.5 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {isOpening && (
            <div className="flex items-center gap-2 text-xs text-muted-foreground">
              <Code2 className="h-3 w-3 animate-pulse" />
              <span>Opening in IDE...</span>
            </div>
          )}

          {isRunningCommand && commandAction && (
            <div
              className={`flex items-center gap-2 text-xs ${
                commandAction === "stopping" ? "text-red-600" : "text-green-600"
              }`}
            >
              {commandAction === "stopping" ? (
                <>
                  <Square className="h-3 w-3 animate-pulse fill-current" />
                  <span>Stopping dev server...</span>
                </>
              ) : (
                <>
                  <Play className="h-3 w-3 animate-pulse" />
                  <span>Starting dev server...</span>
                </>
              )}
            </div>
          )}

          {isProcessRunning && devServerUrl && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                storage.openUrl(devServerUrl);
              }}
              className="flex items-center gap-1.5 text-xs text-blue-600 hover:text-blue-700 hover:underline bg-blue-50 px-2 py-1 rounded group/url"
              title="Click to open in browser"
            >
              <ExternalLink className="h-3 w-3" />
              <span className="font-mono">{devServerUrl}</span>
            </button>
          )}
        </div>
      </CardContent>
      </Card>

      <ConfirmDeleteDialog
        open={showDeleteConfirm}
        onOpenChange={setShowDeleteConfirm}
        onConfirm={handleConfirmDelete}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone. The project files will not be deleted from your disk."
        itemName={project.name}
      />
    </>
  );
}
