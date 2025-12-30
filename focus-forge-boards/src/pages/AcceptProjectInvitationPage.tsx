import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { useProjects } from '@/hooks/use-projects';

const AcceptProjectInvitationPage = () => {
  const { token } = useParams<{ token: string }>();
  const navigate = useNavigate();
  const { user, token: authToken } = useAuth();
  const { fetchProjects } = useProjects();
  const [isLoading, setIsLoading] = useState(true);
  const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading');
  const [projectName, setProjectName] = useState('');
  const [projectId, setProjectId] = useState('');
  const [message, setMessage] = useState('');
  const [inviterName, setInviterName] = useState('');

  useEffect(() => {
    if (!token) {
      setStatus('error');
      setMessage('Token d\'invitation invalide');
      setIsLoading(false);
      return;
    }

    acceptInvitation();
  }, [token, authToken]);

  const acceptInvitation = async () => {
    try {
      if (!authToken) {
        setStatus('error');
        setMessage('Veuillez vous connecter pour accepter cette invitation');
        setIsLoading(false);
        // Store the token in localStorage so we can return here after login
        localStorage.setItem('pendingProjectInviteToken', token || '');
        return;
      }

      // Fetch user email
      const userResponse = await fetch('/api/auth/me', {
        headers: {
          'Authorization': `Bearer ${authToken}`,
        },
      });

      if (!userResponse.ok) {
        throw new Error('Failed to fetch user info');
      }

      const userData = await userResponse.json();
      const email = userData.data?.email || user?.email;

      if (!email) {
        throw new Error('Unable to determine user email');
      }

      // Accept the invitation
      const response = await fetch(`/api/projects/invitations/${token}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          email,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to accept invitation');
      }

      const projectId = data.project?._id || data.project?.id;
      setProjectId(projectId);
      setProjectName(data.project?.name || 'Project');
      setInviterName(data.invitation?.invitedByUserId?.fullName || 'Admin');
      setStatus('success');
      setMessage('Vous avez rejoint le projet avec succès!');
      toast.success('Invitation acceptée!');

      // Refresh projects list so the new project appears
      await fetchProjects();

      // Redirect after 2 seconds
      setTimeout(() => {
        navigate(`/projects/${projectId}`);
      }, 2000);
    } catch (error) {
      console.error('Error accepting invitation:', error);
      setStatus('error');
      setMessage(
        error instanceof Error
          ? error.message
          : 'Une erreur est survenue lors de l\'acceptation de l\'invitation'
      );
      toast.error('Erreur lors de l\'acceptation de l\'invitation');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <MainLayout>
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="text-center space-y-6 max-w-md">
          {status === 'loading' && (
            <>
              <Loader className="w-12 h-12 mx-auto text-primary animate-spin" />
              <p className="text-muted-foreground">Traitement de l'invitation...</p>
            </>
          )}

          {status === 'success' && (
            <>
              <CheckCircle className="w-16 h-16 mx-auto text-green-500" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Bienvenue! 🎉</h1>
                <p className="text-muted-foreground">{message}</p>
                <p className="text-sm text-muted-foreground">
                  Vous avez été ajouté au projet <strong>{projectName}</strong> par {inviterName}
                </p>
              </div>
              <div className="flex flex-col gap-2">
                <Button
                  variant="gradient"
                  onClick={() => navigate(`/projects/${projectId}`)}
                  className="w-full"
                >
                  Voir le projet et le Kanban
                </Button>
                <p className="text-xs text-muted-foreground">
                  Redirection automatique dans 2 secondes...
                </p>
              </div>
            </>
          )}

          {status === 'error' && (
            <>
              <XCircle className="w-16 h-16 mx-auto text-destructive" />
              <div className="space-y-2">
                <h1 className="text-2xl font-bold text-foreground">Erreur</h1>
                <p className="text-muted-foreground">{message}</p>
              </div>
              <div className="flex flex-col gap-2">
                {!authToken && message.includes('connecter') && (
                  <Button
                    variant="gradient"
                    onClick={() => navigate('/login')}
                  >
                    Se connecter
                  </Button>
                )}
                <Button
                  variant="outline"
                  onClick={() => navigate('/projects')}
                >
                  Retour aux projets
                </Button>
              </div>
            </>
          )}
        </div>
      </div>
    </MainLayout>
  );
};

export default AcceptProjectInvitationPage;
