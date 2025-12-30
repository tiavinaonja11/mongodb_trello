import { useState } from 'react';
import { Plus, Search, Filter } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProjectCard } from '@/components/projects/ProjectCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { useProjects } from '@/hooks/use-projects';

const ProjectsPage = () => {
  const [isNewProjectOpen, setIsNewProjectOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { projects, isLoading, error, fetchProjects } = useProjects();

  const filteredProjects = projects.filter(project =>
    project.name.toLowerCase().includes(searchQuery.toLowerCase()) &&
    project.status !== 'archived'
  );

  const handleProjectCreated = () => {
    fetchProjects();
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-1">Projets</h1>
            <p className="text-muted-foreground">
              Gérez vos projets et suivez leur avancement.
            </p>
          </div>
          <Button variant="gradient" onClick={() => setIsNewProjectOpen(true)}>
            <Plus className="w-4 h-4" />
            Nouveau projet
          </Button>
        </div>

        {/* Search & Filter */}
        <div className="flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Rechercher un projet..."
              className="pl-10"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            Filtrer
          </Button>
        </div>

        {/* Error Message */}
        {error && (
          <div className="p-4 bg-destructive/10 border border-destructive rounded-lg text-destructive">
            {error}
          </div>
        )}

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-8 text-muted-foreground">
            Chargement des projets...
          </div>
        )}

        {/* Projects Grid */}
        {!isLoading && filteredProjects.length === 0 && (
          <div className="text-center py-8 text-muted-foreground">
            {searchQuery ? 'Aucun projet ne correspond à votre recherche.' : 'Aucun projet pour le moment. Créez-en un pour commencer !'}
          </div>
        )}

        {!isLoading && filteredProjects.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredProjects.map((project, index) => (
              <div
                key={project.id}
                className="animate-slide-up"
                style={{ animationDelay: `${index * 100}ms` }}
              >
                <ProjectCard project={project} onProjectUpdated={handleProjectCreated} />
              </div>
            ))}
          </div>
        )}
      </div>

      <NewProjectModal
        open={isNewProjectOpen}
        onOpenChange={setIsNewProjectOpen}
        onProjectCreated={handleProjectCreated}
      />
    </MainLayout>
  );
};

export default ProjectsPage;
