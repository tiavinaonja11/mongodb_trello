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
        {/* Page Title */}
        <div className="mb-6">
          <h1 className="text-4xl font-bold text-foreground mb-1">
            Collab Task
          </h1>
          <p className="text-muted-foreground">
            Gérez vos projets et collaborez avec votre équipe
          </p>
        </div>

        {/* Header */}
        <div>
          <h2 className="text-2xl font-semibold text-foreground mb-2">
            Bonjour, {user?.fullName.split(' ')[0]} 👋
          </h2>
          <p className="text-muted-foreground">
            Voici un aperçu de vos projets et tâches.
          </p>
        </div>

        {/* Stats */}
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

        {/* Projects Section */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Projets</h2>
            <a href="/projects" className="text-sm text-primary hover:underline">
              Voir tout
            </a>
          </div>
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
        </section>

        {/* Recent Tickets */}
        <section>
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-foreground">Tâches récentes</h2>
          </div>
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
        </section>
      </div>
    </MainLayout>
  );
};

export default Index;
