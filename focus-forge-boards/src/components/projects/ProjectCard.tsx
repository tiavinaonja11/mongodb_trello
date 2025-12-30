import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { FolderKanban, Calendar, MoreVertical, Edit, Trash2, Archive } from 'lucide-react';
import { Project, ProjectStatus, PROJECT_STATUS_LABELS } from '@/types';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface ProjectCardProps {
  project: Project;
  onProjectUpdated?: () => void;
}

const statusStyles: Record<ProjectStatus, string> = {
  active: 'bg-status-done/20 text-status-done',
  inactive: 'bg-status-progress/20 text-status-progress',
  archived: 'bg-muted text-muted-foreground',
};

export function ProjectCard({ project, onProjectUpdated }: ProjectCardProps) {
  const { token } = useAuth();
  const navigate = useNavigate();
  const [isDeleting, setIsDeleting] = useState(false);
  const memberCount = project.members?.length || 0;

  const handleDeleteProject = async () => {
    if (!window.confirm(`Êtes-vous sûr de vouloir supprimer le projet "${project.name}"?`)) {
      return;
    }

    setIsDeleting(true);
    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la suppression');
      }

      toast.success('Projet supprimé avec succès');
      onProjectUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  const handleChangeStatus = async (newStatus: ProjectStatus) => {
    if (newStatus === project.status) return;

    try {
      const response = await fetch(`/api/projects/${project.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          status: newStatus,
        }),
      });

      if (!response.ok) {
        throw new Error('Erreur lors de la modification');
      }

      toast.success(`Projet changé en ${PROJECT_STATUS_LABELS[newStatus]}`);
      onProjectUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
    }
  };

  const getInitials = (user: any) => {
    if (!user) return '?';

    // If it's a populated user object with fullName
    if (typeof user === 'object' && user.fullName) {
      const parts = user.fullName.split(' ');
      return parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
    }

    // Fallback for string
    const nameStr = String(user);
    const parts = nameStr.split(' ');
    return parts.map((p: string) => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getDisplayName = (user: any) => {
    if (!user) return 'Unknown';
    if (typeof user === 'object' && user.fullName) {
      return user.fullName;
    }
    return String(user);
  };

  const getUserId = (user: any) => {
    if (!user) return 'unknown';
    if (typeof user === 'object' && (user._id || user.id)) {
      return user._id || user.id;
    }
    return String(user);
  };

  const isInactive = project.status === 'inactive';

  return (
    <Link
      to={`/projects/${project.id}`}
      className="block"
    >
      <div className={`ticket-card p-5 h-full flex flex-col group ${isInactive ? 'opacity-75 bg-muted/30' : ''}`}>
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center">
            <FolderKanban className="w-6 h-6 text-primary" />
          </div>
          <div className="flex items-center gap-2">
            <Badge className={cn("text-xs", statusStyles[project.status])}>
              {PROJECT_STATUS_LABELS[project.status]}
            </Badge>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="w-8 h-8 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => e.preventDefault()}
                >
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/projects/${project.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <FolderKanban className="w-4 h-4 mr-2" />
                  Voir le kanban
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    navigate(`/projects/${project.id}`);
                  }}
                  className="cursor-pointer"
                >
                  <Edit className="w-4 h-4 mr-2" />
                  Modifier
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuSub>
                  <DropdownMenuSubTrigger className="cursor-pointer">
                    <Archive className="w-4 h-4 mr-2" />
                    Statut
                  </DropdownMenuSubTrigger>
                  <DropdownMenuSubContent>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleChangeStatus('active');
                      }}
                      className={`cursor-pointer ${project.status === 'active' ? 'bg-accent' : ''}`}
                    >
                      ✓ Actif
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleChangeStatus('inactive');
                      }}
                      className={`cursor-pointer ${project.status === 'inactive' ? 'bg-accent' : ''}`}
                    >
                      ✓ Inactif
                    </DropdownMenuItem>
                    <DropdownMenuItem
                      onClick={(e) => {
                        e.preventDefault();
                        handleChangeStatus('archived');
                      }}
                      className={`cursor-pointer ${project.status === 'archived' ? 'bg-accent' : ''}`}
                    >
                      ✓ Archivé
                    </DropdownMenuItem>
                  </DropdownMenuSubContent>
                </DropdownMenuSub>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={(e) => {
                    e.preventDefault();
                    handleDeleteProject();
                  }}
                  className="cursor-pointer text-destructive focus:text-destructive"
                  disabled={isDeleting}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Supprimer
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Content */}
        <h3 className="font-semibold text-lg text-foreground mb-2 group-hover:text-primary transition-colors">
          {project.name}
        </h3>
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2 flex-1">
          {project.description}
        </p>

        {/* Footer */}
        <div className="flex items-center justify-between pt-4 border-t border-border/50">
          <div className="flex items-center gap-3 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <FolderKanban className="w-4 h-4" />
              <span>{memberCount}</span>
            </div>
            {project.dueDate && (
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4" />
                <span>{format(new Date(project.dueDate), 'd MMM', { locale: fr })}</span>
              </div>
            )}
          </div>

          {/* Members */}
          <div className="flex -space-x-2">
            {project.members && project.members.slice(0, 4).map((member) => (
              <div
                key={getUserId(member.userId)}
                className="w-7 h-7 rounded-full bg-secondary border-2 border-card flex items-center justify-center"
                title={getDisplayName(member.userId)}
              >
                <span className="text-[10px] font-medium">
                  {getInitials(member.userId)}
                </span>
              </div>
            ))}
            {memberCount > 4 && (
              <div className="w-7 h-7 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                <span className="text-[10px] font-medium text-muted-foreground">
                  +{memberCount - 4}
                </span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
