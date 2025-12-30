import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { NewProjectModal } from '@/components/projects/NewProjectModal';
import { useProjects } from '@/hooks/use-projects';

const NewProjectPage = () => {
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(true);
  const { fetchProjects } = useProjects();

  const handleOpenChange = (open: boolean) => {
    setIsOpen(open);
    if (!open) {
      navigate('/projects');
    }
  };

  const handleProjectCreated = () => {
    fetchProjects();
    setIsOpen(false);
    navigate('/projects');
  };

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-1">Créer un projet</h1>
          <p className="text-muted-foreground">
            Créez un nouveau projet pour commencer à collaborer avec votre équipe.
          </p>
        </div>
      </div>

      <NewProjectModal
        open={isOpen}
        onOpenChange={handleOpenChange}
        onProjectCreated={handleProjectCreated}
      />
    </MainLayout>
  );
};

export default NewProjectPage;
