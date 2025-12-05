import { Project, IDE } from "@/types";
import { ProjectCard } from "./ProjectCard";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ProjectGridProps {
  projects: Project[];
  onProjectDelete: (projectId: string) => void;
  onProjectEdit: (project: Project) => void;
  onViewDetails: (project: Project) => void;
  onAddProject: () => void;
  defaultIDE: IDE;
}

export function ProjectGrid({
  projects,
  onProjectDelete,
  onProjectEdit,
  onViewDetails,
  onAddProject,
  defaultIDE,
}: ProjectGridProps) {
  if (projects.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center p-8">
        <div className="max-w-md space-y-4">
          <div className="text-3xl">📁</div>
          <h3 className="text-lg font-semibold">No projects yet</h3>
          <p className="text-sm text-muted-foreground">
            Start by adding your first project to this workspace
          </p>
          <Button onClick={onAddProject}>
            <Plus className="h-4 w-4 mr-2" />
            Add Project
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          onDelete={onProjectDelete}
          onEdit={onProjectEdit}
          onViewDetails={onViewDetails}
          defaultIDE={defaultIDE}
        />
      ))}
    </div>
  );
}
