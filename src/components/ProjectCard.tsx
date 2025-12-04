import { useState } from "react";
import {
  Code2,
  FolderOpen,
  Trash2,
  Calendar,
  AlertCircle,
  Edit2,
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
import { storage } from "@/lib/storage";
import { getIcon } from "@/lib/iconMap";

interface ProjectCardProps {
  project: Project;
  onDelete: (projectId: string) => void;
  onEdit: (project: Project) => void;
  defaultIDE: IDE;
}

export function ProjectCard({
  project,
  onDelete,
  onEdit,
  defaultIDE,
}: ProjectCardProps) {
  const [isOpening, setIsOpening] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleOpenInIDE = async () => {
    setIsOpening(true);
    setError(null);

    const result = await storage.openInIDE(project.path, defaultIDE);

    if (!result.success) {
      setError(result.error || "Failed to open IDE");
    }

    setIsOpening(false);
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
    <Card
      className="group hover:shadow-lg transition-shadow duration-200 cursor-pointer"
      onClick={handleOpenInIDE}
    >
      <CardHeader>
        <div className="flex items-start justify-between">
          <div className="flex-1">
            <CardTitle className="text-base flex items-center gap-2">
              {project.icon ? (
                (() => {
                  const Icon = getIcon(project.icon);
                  return <Icon className="h-4 w-4" />;
                })()
              ) : (
                <FolderOpen className="h-4 w-4" />
              )}
              {project.name}
            </CardTitle>
            {project.description && (
              <CardDescription className="mt-2 text-xs">
                {project.description}
              </CardDescription>
            )}
          </div>
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onEdit(project);
              }}
            >
              <Edit2 className="h-4 w-4" />
            </Button>
            <Button
              size="icon"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                onDelete(project.id);
              }}
            >
              <Trash2 className="h-4 w-4" />
            </Button>
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
        </div>
      </CardContent>
    </Card>
  );
}
