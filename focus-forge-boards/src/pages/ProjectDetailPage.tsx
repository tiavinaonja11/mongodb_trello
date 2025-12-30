import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Plus, Settings, Users } from 'lucide-react';
import { toast } from 'sonner';
import { MainLayout } from '@/components/layout/MainLayout';
import { KanbanBoard } from '@/components/kanban/KanbanBoard';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PROJECT_STATUS_LABELS, ProjectStatus } from '@/types';
import { cn } from '@/lib/utils';
import { NewTicketModal } from '@/components/tickets/NewTicketModal';
import { InviteToProjectModal } from '@/components/projects/InviteToProjectModal';
import { useProjects } from '@/hooks/use-projects';
import { useTickets } from '@/hooks/use-tickets';

const statusStyles: Record<ProjectStatus, string> = {
  active: 'bg-status-done/20 text-status-done',
  inactive: 'bg-status-progress/20 text-status-progress',
  archived: 'bg-muted text-muted-foreground',
};

const ProjectDetailPage = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isNewTicketOpen, setIsNewTicketOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const { projects, isLoading: projectsLoading, fetchProjects } = useProjects();
  const { tickets, isLoading: ticketsLoading, fetchTickets } = useTickets(id || '');

  const project = projects.find((p) => p.id === id);
  const isProjectRestricted = project && (project.status === 'inactive' || project.status === 'archived');
  const isProjectArchived = project && project.status === 'archived';

  useEffect(() => {
    if (!id) return;
  }, [id]);

  const handleOpenNewTicket = () => {
    setIsNewTicketOpen(true);
  };

  const handleInviteSent = () => {
    toast.success('Invitations envoyées avec succès');
    fetchProjects();
  };

  if (projectsLoading) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Chargement du projet...</p>
        </div>
      </MainLayout>
    );
  }

  if (!project) {
    return (
      <MainLayout>
        <div className="flex items-center justify-center h-[60vh]">
          <p className="text-muted-foreground">Projet non trouvé</p>
        </div>
      </MainLayout>
    );
  }

  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const getProjectMembers = () => {
    if (!project?.members) return [];
    return project.members.map((m: any) => {
      // Handle both populated and non-populated member data
      const userId = typeof m.userId === 'object' ? m.userId._id || m.userId.id : m.userId;
      const fullName = typeof m.userId === 'object' ? (m.userId.fullName || m.userId.email) : m.userId;
      const email = typeof m.userId === 'object' ? (m.userId.email || '') : '';

      return {
        id: userId.toString ? userId.toString() : String(userId),
        fullName: String(fullName),
        email: String(email),
      };
    });
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-center gap-3 mb-2">
              <h1 className="text-3xl font-bold text-foreground">{project.name}</h1>
              <Badge className={cn("text-xs", statusStyles[project.status])}>
                {PROJECT_STATUS_LABELS[project.status]}
              </Badge>
            </div>
            <p className="text-muted-foreground">{project.description}</p>
          </div>

          <div className="flex items-center gap-3">
            {/* Members */}
            <div className="flex items-center gap-2">
              <div className="flex -space-x-2">
                {getProjectMembers().slice(0, 4).map((member) => (
                  <div
                    key={member.id}
                    className="w-9 h-9 rounded-full bg-secondary border-2 border-background flex items-center justify-center"
                    title={member.fullName}
                  >
                    <span className="text-xs font-medium">
                      {getInitials(member.fullName)}
                    </span>
                  </div>
                ))}
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={() => setIsInviteOpen(true)}
                title="Inviter des membres"
              >
                <Users className="w-4 h-4" />
              </Button>
            </div>

            <Button
              variant="gradient"
              onClick={handleOpenNewTicket}
              disabled={isProjectRestricted}
              title={isProjectRestricted ? 'Impossible de créer des tickets en lecture seule' : ''}
            >
              <Plus className="w-4 h-4" />
              Nouveau ticket
            </Button>
          </div>
        </div>

        {/* Status Warning */}
        {isProjectRestricted && (
          <div className={`p-4 rounded-lg border ${
            isProjectArchived
              ? 'bg-muted/50 border-muted text-muted-foreground'
              : 'bg-status-progress/10 border-status-progress text-status-progress'
          }`}>
            {isProjectArchived
              ? '🔒 Ce projet est archivé. Vous pouvez consulter les tickets mais ne pouvez pas les modifier.'
              : '⏸️ Ce projet est inactif. Vous pouvez consulter les tickets mais ne pouvez pas en créer de nouveaux ou les modifier.'}
          </div>
        )}

        {/* Kanban Board */}
        {ticketsLoading ? (
          <div className="flex items-center justify-center h-[60vh]">
            <p className="text-muted-foreground">Chargement des tickets...</p>
          </div>
        ) : (
          <KanbanBoard
            tickets={tickets}
            projectId={id}
            onAddTicket={handleOpenNewTicket}
            onTicketUpdated={() => fetchTickets()}
            isReadOnly={isProjectRestricted}
          />
        )}
      </div>

      <NewTicketModal
        open={isNewTicketOpen}
        onOpenChange={setIsNewTicketOpen}
        projectId={id || ''}
        members={getProjectMembers()}
        onTicketCreated={() => fetchTickets()}
        isReadOnly={isProjectRestricted}
      />

      <InviteToProjectModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        projectId={id || ''}
        projectName={project?.name || ''}
        onInviteSent={handleInviteSent}
      />
    </MainLayout>
  );
};

export default ProjectDetailPage;
