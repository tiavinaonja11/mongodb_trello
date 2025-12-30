import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { useInvitations } from '@/hooks/use-invitations';
import { useProjectInvitations } from '@/hooks/use-project-invitations';
import { useAuth } from '@/contexts/AuthContext';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { CheckCircle, XCircle, Clock, Users, FolderOpen } from 'lucide-react';

export default function InvitationsPage() {
  const { user } = useAuth();
  const { invitations: teamInvitations, loading: teamLoading, acceptInvitation: acceptTeamInvitation, rejectInvitation: rejectTeamInvitation } = useInvitations();
  const { invitations: projectInvitations, loading: projectLoading, acceptInvitation: acceptProjectInvitation, rejectInvitation: rejectProjectInvitation } = useProjectInvitations();
  const [processingId, setProcessingId] = useState<string | null>(null);

  const loading = teamLoading || projectLoading;

  useEffect(() => {
    // Invitations are fetched automatically by hooks
  }, []);

  const handleAcceptTeamInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await acceptTeamInvitation(invitationId);
      toast.success('Invitation d\'équipe acceptée !');
    } catch (error) {
      toast.error('Erreur lors de l\'acceptation de l\'invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectTeamInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await rejectTeamInvitation(invitationId);
      toast.success('Invitation d\'équipe refusée.');
    } catch (error) {
      toast.error('Erreur lors du refus de l\'invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleAcceptProjectInvitation = async (invitationToken: string) => {
    setProcessingId(invitationToken);
    try {
      if (!user?.email) throw new Error('Email not found');
      await acceptProjectInvitation(invitationToken, user.email);
      toast.success('Invitation de projet acceptée ! Accédez au projet depuis votre dashboard.');
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'acceptation de l\'invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  const handleRejectProjectInvitation = async (invitationId: string) => {
    setProcessingId(invitationId);
    try {
      await rejectProjectInvitation(invitationId);
      toast.success('Invitation de projet refusée.');
    } catch (error) {
      toast.error('Erreur lors du refus de l\'invitation');
      console.error(error);
    } finally {
      setProcessingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Chargement des invitations...</p>
        </div>
      </div>
    );
  }

  const hasTeamInvitations = teamInvitations.length > 0;
  const hasProjectInvitations = projectInvitations.length > 0;
  const hasAnyInvitations = hasTeamInvitations || hasProjectInvitations;

  return (
    <div className="space-y-6 p-6 max-w-4xl mx-auto">
      <div>
        <h1 className="text-3xl font-bold">Invitations</h1>
        <p className="text-muted-foreground mt-2">
          Gérez vos invitations pour rejoindre des équipes et des projets
        </p>
      </div>

      {!hasAnyInvitations ? (
        <Card className="border-dashed">
          <CardContent className="flex items-center justify-center min-h-48">
            <div className="text-center">
              <Clock className="mx-auto h-12 w-12 text-muted-foreground/50 mb-4" />
              <p className="text-muted-foreground">Aucune invitation en attente</p>
              <p className="text-sm text-muted-foreground mt-1">
                Vous recevrez une notification quand on vous invitera à rejoindre une équipe ou un projet
              </p>
            </div>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-6">
          {/* Project Invitations */}
          {hasProjectInvitations && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <FolderOpen className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Invitations de projet</h2>
              </div>
              <div className="grid gap-4">
                {projectInvitations.map((invitation) => (
                  <Card key={invitation._id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{invitation.projectId.name}</CardTitle>
                          <CardDescription>
                            Invité par {invitation.invitedByUserId?.fullName || 'Un membre du projet'}
                          </CardDescription>
                        </div>
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          En attente
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {invitation.projectId.description && (
                        <p className="text-sm text-muted-foreground">
                          {invitation.projectId.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{invitation.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rôle</p>
                          <p className="font-medium">
                            {invitation.role === 'admin' ? 'Administrateur' : 'Membre'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Invitation reçue {format(new Date(invitation.createdAt), 'd MMM yyyy à HH:mm', { locale: fr })}
                        {' • '}
                        Expire {format(new Date(invitation.expiresAt), 'd MMM yyyy', { locale: fr })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleAcceptProjectInvitation(invitation.token)}
                          disabled={processingId === invitation.token}
                          className="flex-1"
                          variant="gradient"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {processingId === invitation.token ? 'Traitement...' : 'Accepter'}
                        </Button>
                        <Button
                          onClick={() => handleRejectProjectInvitation(invitation._id)}
                          disabled={processingId === invitation._id}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {processingId === invitation._id ? 'Traitement...' : 'Refuser'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {/* Team Invitations */}
          {hasTeamInvitations && (
            <div className="space-y-3">
              <div className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                <h2 className="text-xl font-semibold">Invitations d'équipe</h2>
              </div>
              <div className="grid gap-4">
                {teamInvitations.map((invitation) => (
                  <Card key={invitation._id} className="overflow-hidden">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{invitation.teamId.name}</CardTitle>
                          <CardDescription>
                            Invité par {invitation.invitedByUserId?.fullName || 'Un membre de l\'équipe'}
                          </CardDescription>
                        </div>
                        <div className="px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm font-medium flex items-center gap-2">
                          <Clock className="h-3 w-3" />
                          En attente
                        </div>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      {invitation.teamId.description && (
                        <p className="text-sm text-muted-foreground">
                          {invitation.teamId.description}
                        </p>
                      )}

                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <p className="text-muted-foreground">Email</p>
                          <p className="font-medium">{invitation.email}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Rôle</p>
                          <p className="font-medium">
                            {invitation.role === 'admin' ? 'Administrateur' : 'Membre'}
                          </p>
                        </div>
                      </div>

                      <div className="text-xs text-muted-foreground">
                        Invitation reçue {format(new Date(invitation.createdAt), 'd MMM yyyy à HH:mm', { locale: fr })}
                        {' • '}
                        Expire {format(new Date(invitation.expiresAt), 'd MMM yyyy', { locale: fr })}
                      </div>

                      <div className="flex gap-2 pt-2">
                        <Button
                          onClick={() => handleAcceptTeamInvitation(invitation._id)}
                          disabled={processingId === invitation._id}
                          className="flex-1"
                          variant="gradient"
                        >
                          <CheckCircle className="mr-2 h-4 w-4" />
                          {processingId === invitation._id ? 'Traitement...' : 'Accepter'}
                        </Button>
                        <Button
                          onClick={() => handleRejectTeamInvitation(invitation._id)}
                          disabled={processingId === invitation._id}
                          variant="outline"
                          className="flex-1"
                        >
                          <XCircle className="mr-2 h-4 w-4" />
                          {processingId === invitation._id ? 'Traitement...' : 'Refuser'}
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
