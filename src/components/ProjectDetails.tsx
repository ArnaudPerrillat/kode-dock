import { useState, useEffect } from "react";
import {
  ArrowLeft,
  FolderOpen,
  Code2,
  Edit2,
  Trash2,
  Calendar,
  Play,
  Square,
  AlertCircle,
  Terminal,
  Globe,
  ExternalLink,
} from "lucide-react";
import { Project, IDE } from "@/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { storage } from "@/lib/storage";
import { getIcon } from "@/lib/iconMap";

interface ProjectDetailsProps {
  project: Project;
  onBack: () => void;
  onEdit: (project: Project) => void;
  onDelete: (projectId: string) => void;
  defaultIDE: IDE;
  isSidePanel?: boolean;
}

export function ProjectDetails({
  project,
  onBack,
  onEdit,
  onDelete,
  defaultIDE,
  isSidePanel = false,
}: ProjectDetailsProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isRunningCommand, setIsRunningCommand] = useState(false);
  const [isProcessRunning, setIsProcessRunning] = useState(false);

  // Check if process is running on mount
  useEffect(() => {
    const checkProcess = async () => {
      const running = await storage.isProcessRunning(project.path);
      setIsProcessRunning(running);
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

  const handleOpenInExplorer = async () => {
    setError(null);
    const result = await storage.openInExplorer(project.path);

    if (!result.success) {
      setError(result.error || "Failed to open file explorer");
    }
  };

  const handleRunDevServer = async () => {
    setIsRunningCommand(true);
    setError(null);

    const command = project.devServerCommand || "npm run dev";
    const openInBrowser = project.openInBrowser ?? true;
    const openInTerminal = project.openInTerminal ?? false;
    const result = await storage.runDevServer(
      project.path,
      command,
      openInBrowser,
      openInTerminal
    );

    if (!result.success) {
      setError(result.error || "Failed to start dev server");
      setIsRunningCommand(false);
    } else {
      setIsProcessRunning(true);
      setTimeout(() => {
        setIsRunningCommand(false);
      }, 2000);
    }
  };

  const handleStopDevServer = async () => {
    setIsRunningCommand(true);
    setError(null);

    const result = await storage.killProcess(project.path);

    if (!result.success) {
      setError(result.error || "Failed to stop dev server");
    } else {
      setIsProcessRunning(false);
    }

    setTimeout(() => {
      setIsRunningCommand(false);
    }, 1000);
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const Icon = project.icon ? getIcon(project.icon) : FolderOpen;

  return (
    <div className="h-full bg-card">
      {/* Header */}
      <div
        className={`bg-card ${
          isSidePanel ? "sticky top-0 z-10" : "fixed w-full z-10"
        }`}
      >
        <div className={isSidePanel ? "p-4" : "p-6"}>
          <Button variant="ghost" onClick={onBack} className="mb-4 -ml-2">
            <ArrowLeft className="h-4 w-4 mr-2" />
            {isSidePanel ? "Close" : "Back to Projects"}
          </Button>

          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 mb-2">
                <Icon className={`${"h-6 w-6"} text-primary flex-shrink-0`} />
                <h1
                  className={`${
                    isSidePanel ? "text-xl" : "text-3xl"
                  } font-bold truncate`}
                >
                  {project.name}
                </h1>
                {isProcessRunning && (
                  <Badge
                    variant="secondary"
                    className="bg-green-100 text-green-700 border-green-300"
                  >
                    Running
                  </Badge>
                )}
              </div>
              {project.description && (
                <p
                  className={`text-muted-foreground mt-2 ${
                    isSidePanel ? "text-sm" : ""
                  }`}
                >
                  {project.description}
                </p>
              )}
            </div>

            <div className={`flex gap-2 ${isSidePanel ? "flex-col" : ""}`}>
              <Button
                variant="outline"
                onClick={() => onEdit(project)}
                size={isSidePanel ? "sm" : "default"}
              >
                <Edit2 className="h-4 w-4 mr-2" />
                Edit
              </Button>
              <Button
                variant="outline"
                onClick={() => onDelete(project.id)}
                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                size={isSidePanel ? "sm" : "default"}
              >
                <Trash2 className="h-4 w-4 mr-2" />
                Delete
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div
        className={`space-y-6 ${isSidePanel ? "p-4" : "p-6 pt-48 max-w-3xl"}`}
      >
        {/* Error Display */}
        {error && (
          <div className="flex items-start gap-2 text-sm text-destructive bg-destructive/10 px-4 py-3 rounded-lg">
            <AlertCircle className="h-4 w-4 mt-0.5 flex-shrink-0" />
            <span>{error}</span>
          </div>
        )}

        {/* Actions Card */}
        <Card>
          <CardHeader>
            <CardTitle className={isSidePanel ? "text-base" : "text-lg"}>
              Quick Actions
            </CardTitle>
          </CardHeader>
          <CardContent
            className={`space-y-3 ${isSidePanel ? "" : "space-x-3 flex"}`}
          >
            <Button
              onClick={handleOpenInIDE}
              disabled={isOpening}
              className={`w-full justify-start ${
                isSidePanel ? "h-10" : "h-12"
              }`}
            >
              <Code2
                className={`${isSidePanel ? "h-4 w-4" : "h-5 w-5"} mr-3`}
              />
              {isOpening ? "Opening..." : `Open in ${defaultIDE.toUpperCase()}`}
            </Button>

            {(project.devServerEnabled ?? true) &&
              (isProcessRunning ? (
                <Button
                  onClick={handleStopDevServer}
                  disabled={isRunningCommand}
                  variant="outline"
                  className={`w-full justify-start ${
                    isSidePanel ? "h-10" : "h-12"
                  } text-red-600 hover:text-red-700 hover:bg-red-50`}
                >
                  <Square
                    className={`${
                      isSidePanel ? "h-4 w-4" : "h-5 w-5"
                    } mr-3 fill-current`}
                  />
                  {isRunningCommand ? "Stopping..." : "Stop Dev Server"}
                </Button>
              ) : (
                <Button
                  onClick={handleRunDevServer}
                  disabled={isRunningCommand}
                  variant="outline"
                  className={`w-full justify-start ${
                    isSidePanel ? "h-10" : "h-12"
                  }`}
                >
                  <Play
                    className={`${isSidePanel ? "h-4 w-4" : "h-5 w-5"} mr-3`}
                  />
                  {isRunningCommand ? "Starting..." : "Start Dev Server"}
                </Button>
              ))}

            <Button
              onClick={handleOpenInExplorer}
              variant="outline"
              className={`w-full justify-start ${
                isSidePanel ? "h-10" : "h-12"
              }`}
            >
              <FolderOpen
                className={`${isSidePanel ? "h-4 w-4" : "h-5 w-5"} mr-3`}
              />
              Open in File Explorer
            </Button>
          </CardContent>
        </Card>

        {/* Project Information */}
        <Card>
          <CardHeader>
            <CardTitle className={isSidePanel ? "text-base" : "text-lg"}>
              Project Information
            </CardTitle>
          </CardHeader>
          <CardContent className={isSidePanel ? "space-y-3" : "space-y-4"}>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Path
              </h3>
              <div className="flex items-center gap-2">
                <code className="text-sm bg-muted px-3 py-2 rounded flex-1 font-mono">
                  {project.path}
                </code>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={handleOpenInExplorer}
                  title="Open in file explorer"
                >
                  <ExternalLink className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {project.tags.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-2">
                  Tags
                </h3>
                <div className="flex flex-wrap gap-2">
                  {project.tags.map((tag, index) => (
                    <Badge key={index} variant="secondary" className="text-sm">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-1">
                Created
              </h3>
              <div className="flex items-center gap-2 text-sm">
                <Calendar className="h-4 w-4" />
                {formatDate(project.createdAt)}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Development Settings */}
        {(project.devServerEnabled ?? true) && (
          <Card>
            <CardHeader>
              <CardTitle className={isSidePanel ? "text-base" : "text-lg"}>
                Development Settings
              </CardTitle>
            </CardHeader>
            <CardContent className={isSidePanel ? "space-y-3" : "space-y-4"}>
              <div>
                <h3 className="text-sm font-medium text-muted-foreground mb-1">
                  Dev Server Command
                </h3>
                <code className="text-sm bg-muted px-3 py-2 rounded block font-mono">
                  {project.devServerCommand || "npm run dev"}
                </code>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Open in Browser
                  </h3>
                  <div className="flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    <span className="text-sm">
                      {project.openInBrowser ?? true ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>

                <div>
                  <h3 className="text-sm font-medium text-muted-foreground mb-1">
                    Open in Terminal
                  </h3>
                  <div className="flex items-center gap-2">
                    <Terminal className="h-4 w-4" />
                    <span className="text-sm">
                      {project.openInTerminal ?? false ? "Enabled" : "Disabled"}
                    </span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}
