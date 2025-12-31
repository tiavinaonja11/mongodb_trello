import { FolderKanban, CheckCircle2, Clock, Users } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { StatsCard } from '@/components/dashboard/StatsCard';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { TicketCard } from '@/components/tickets/TicketCard';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';
import { useEffect, useState } from 'react';

interface AllTickets {
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  estimatedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  creatorId: string;
  assignees: string[];
}

const Index = () => {
  const { user } = useAuth();
  const { projects } = useProjects();
  const navigate = useNavigate();
  const [allTickets, setAllTickets] = useState<AllTickets[]>([]);
  const [isLoadingTickets, setIsLoadingTickets] = useState(false);

  // Fetch all tickets from all projects
  useEffect(() => {
    const fetchAllTickets = async () => {
      if (!projects.length) return;

      setIsLoadingTickets(true);
      try {
        const token = localStorage.getItem('authToken');
        const ticketPromises = projects.map((project) =>
          fetch(`/api/tickets/project/${project.id}`, {
            headers: {
              'Authorization': `Bearer ${token}`,
            },
          }).then((res) => res.json())
        );

        const results = await Promise.all(ticketPromises);
        const allProjectTickets: AllTickets[] = [];

        results.forEach((result) => {
          if (result.success && result.tickets) {
            allProjectTickets.push(...result.tickets);
          }
        });

        setAllTickets(allProjectTickets);
      } catch (error) {
        console.error('Error fetching tickets:', error);
      } finally {
        setIsLoadingTickets(false);
      }
    };

    fetchAllTickets();
  }, [projects]);

  const displayedProjects = projects.filter((p) => p.status !== 'archived');
  const recentTickets = allTickets.slice(0, 4);

  const stats = {
    projects: projects.length,
    completedTickets: allTickets.filter((t) => t.status === 'done').length,
    inProgressTickets: allTickets.filter((t) => t.status === 'in_progress').length,
    totalMembers: new Set(
      projects.flatMap((p) => {
        const memberIds: string[] = [];

        // Add project owner
        if (p.ownerId) {
          const ownerId = typeof p.ownerId === 'object'
            ? (p.ownerId._id || p.ownerId.id)
            : p.ownerId;
          if (ownerId) memberIds.push(ownerId as string);
        }

        // Add project members
        if (p.members && Array.isArray(p.members)) {
          p.members.forEach((m: any) => {
            const userId = typeof m.userId === 'object'
              ? (m.userId._id || m.userId.id)
              : m.userId;
            if (userId) memberIds.push(userId as string);
          });
        }

        return memberIds;
      })
    ).size || 0,
  };


  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Header Section */}
        <div className="space-y-4">
          <div className="space-y-2">
            <h1 className="text-4xl font-bold bg-gradient-to-r from-primary via-primary to-accent bg-clip-text text-transparent">
              Collab Task
            </h1>
            <p className="text-muted-foreground text-lg">
              Gérez vos projets et collaborez avec votre équipe
            </p>
          </div>

          {/* Greeting */}
          <div className="pt-4 pl-1 border-l-4 border-primary/50">
            <h2 className="text-2xl font-semibold text-foreground">
              Bonjour, <span className="text-primary">{user?.fullName.split(' ')[0]}</span> 👋
            </h2>
            <p className="text-muted-foreground text-sm mt-1">
              Voici un aperçu de vos projets et tâches en temps réel.
            </p>
          </div>
        </div>

        {/* Stats Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Vue d'ensemble</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <StatsCard
              title="Projets actifs"
              value={stats.projects}
              icon={FolderKanban}
              trend={{ value: 12, positive: true }}
            />
            <StatsCard
              title="Tâches terminées"
              value={stats.completedTickets}
              icon={CheckCircle2}
              trend={{ value: 8, positive: true }}
            />
            <StatsCard
              title="En cours"
              value={stats.inProgressTickets}
              icon={Clock}
            />
            <StatsCard
              title="Membres d'équipe"
              value={stats.totalMembers}
              icon={Users}
            />
          </div>
        </div>

        {/* Projects Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Projets</h2>
              <p className="text-sm text-muted-foreground">{displayedProjects.length} projet{displayedProjects.length !== 1 ? 's' : ''} actif{displayedProjects.length !== 1 ? 's' : ''}</p>
            </div>
            <a href="/projects" className="text-sm font-medium text-primary hover:text-primary/80 hover:underline transition-colors duration-200">
              Voir tous les projets →
            </a>
          </div>

          {displayedProjects.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {displayedProjects.map((project, index) => (
                <div
                  key={project.id}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <ProjectCard project={project} onProjectUpdated={() => {}} />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed border-border bg-card/50">
              <FolderKanban className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium mb-2">Aucun projet pour le moment</p>
              <a href="/projects/new" className="text-sm text-primary hover:underline">
                Créer votre premier projet
              </a>
            </div>
          )}
        </section>

        {/* Recent Tickets Section */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <h2 className="text-2xl font-bold text-foreground">Tâches récentes</h2>
              <p className="text-sm text-muted-foreground">{recentTickets.length} tâche{recentTickets.length !== 1 ? 's' : ''} affichée{recentTickets.length !== 1 ? 's' : ''}</p>
            </div>
          </div>

          {recentTickets.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {recentTickets.map((ticket, index) => (
                <div
                  key={ticket.id || `ticket-${index}`}
                  className="animate-slide-up"
                  style={{ animationDelay: `${index * 100}ms` }}
                >
                  <TicketCard
                    ticket={ticket}
                    onClick={() => navigate(`/projects/${ticket.projectId}`)}
                  />
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 rounded-lg border-2 border-dashed border-border bg-card/50">
              <Clock className="w-12 h-12 text-muted-foreground/50 mb-3" />
              <p className="text-muted-foreground font-medium mb-2">Aucune tâche pour le moment</p>
              <p className="text-xs text-muted-foreground">Créez un projet pour commencer à créer des tâches</p>
            </div>
          )}
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
