import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useTickets } from '@/hooks/use-tickets';
import { useAuth } from '@/contexts/AuthContext';
import { TeamMemberStatusCard } from '@/components/team/TeamMemberStatusCard';

interface ProjectMember {
  id: string;
  fullName: string;
  email: string;
}

interface NewTicketModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  members?: ProjectMember[];
  onTicketCreated?: () => void;
  isReadOnly?: boolean;
}

interface TeamMember {
  _id?: string;
  userId?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: number;
  role: string;
  projectCount: number;
}

interface Team {
  _id: string;
  name: string;
  members: TeamMember[];
}

export const NewTicketModal = ({ open, onOpenChange, projectId, members = [], onTicketCreated, isReadOnly = false }: NewTicketModalProps) => {
  const { createTicket } = useTickets(projectId);
  const { user } = useAuth();
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState('todo');
  const [priority, setPriority] = useState('medium');
  const [selectedTeamId, setSelectedTeamId] = useState('');
  const [estimatedDate, setEstimatedDate] = useState('');
  const [assigneeIds, setAssigneeIds] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [teams, setTeams] = useState<Team[]>([]);
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([]);
  const [invitationStatuses, setInvitationStatuses] = useState<Record<string, 'pending' | 'accepted' | 'rejected'>>({});

  useEffect(() => {
    if (open && isReadOnly) {
      toast.error('Impossible de créer des tickets dans un projet inactif');
      onOpenChange(false);
      return;
    }

    if (open) {
      fetchTeams();
    }
  }, [open, isReadOnly]);

  useEffect(() => {
    filterTeamMembers();
    if (selectedTeamId) {
      fetchInvitationStatuses(selectedTeamId);
    }
  }, [selectedTeamId, teams]);

  const fetchTeams = async () => {
    try {
      const response = await fetch('/api/teams');
      if (!response.ok) throw new Error('Failed to fetch teams');
      const data = await response.json();
      setTeams(data.data || []);
    } catch (error) {
      console.error('Error fetching teams:', error);
    }
  };

  const fetchInvitationStatuses = async (teamId: string) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/invitations/statuses`, {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });
      if (!response.ok) throw new Error('Failed to fetch invitation statuses');
      const data = await response.json();
      setInvitationStatuses(data.data || {});
    } catch (error) {
      console.error('Error fetching invitation statuses:', error);
    }
  };

  const filterTeamMembers = () => {
    if (!selectedTeamId) {
      setTeamMembers([]);
      return;
    }

    const selectedTeam = teams.find((t) => t._id === selectedTeamId);
    if (selectedTeam && selectedTeam.members && selectedTeam.members.length > 0) {
      // Show all members from the selected team
      // (they must have accepted to be in the team to appear here)
      setTeamMembers(selectedTeam.members);
    } else {
      setTeamMembers([]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (isReadOnly) {
      toast.error('Impossible de créer des tickets dans un projet inactif');
      onOpenChange(false);
      return;
    }

    if (!title.trim()) {
      toast.error('Le titre du ticket est requis');
      return;
    }

    if (estimatedDate && new Date(estimatedDate) < new Date()) {
      toast.error('La date d\'estimation ne peut pas être dans le passé');
      return;
    }

    setIsLoading(true);

    try {
      console.log('📝 Creating ticket with:', { title, assigneeIds, selectedTeamId });
      const newTicket = await createTicket(title, description, status, priority, selectedTeamId, assigneeIds, estimatedDate);
      console.log('✅ Ticket created:', newTicket);
      toast.success(`Ticket "${title}" créé avec succès !`);

      setTitle('');
      setDescription('');
      setStatus('todo');
      setPriority('medium');
      setSelectedTeamId('');
      setEstimatedDate('');
      setAssigneeIds([]);
      onOpenChange(false);

      if (onTicketCreated) {
        onTicketCreated();
      }
    } catch (error) {
      toast.error('Erreur lors de la création du ticket');
      console.error('Error creating ticket:', error);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Nouveau ticket</DialogTitle>
          <DialogDescription>Créez un nouveau ticket pour votre projet</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 pr-4">
          {/* Section Informations principales */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-foreground">Informations principales</h3>
              <span className="text-xs text-muted-foreground">*Requis</span>
            </div>

            <div className="space-y-2">
              <Label htmlFor="ticket-title" className="font-medium">Titre</Label>
              <Input
                id="ticket-title"
                placeholder="Ex: Corriger le bug d'affichage"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="bg-background"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="ticket-description" className="font-medium">Description</Label>
              <Textarea
                id="ticket-description"
                placeholder="Décrivez le ticket en détail..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
                className="bg-background resize-none"
              />
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Section Statut et Priorité */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Statut et priorité</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-status" className="font-medium text-sm">Statut</Label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger id="ticket-status">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="todo">À faire</SelectItem>
                    <SelectItem value="in_progress">En cours</SelectItem>
                    <SelectItem value="review">En validation</SelectItem>
                    <SelectItem value="done">Terminé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-priority" className="font-medium text-sm">Priorité</Label>
                <Select value={priority} onValueChange={setPriority}>
                  <SelectTrigger id="ticket-priority">
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="low">Basse</SelectItem>
                    <SelectItem value="medium">Moyenne</SelectItem>
                    <SelectItem value="high">Haute</SelectItem>
                    <SelectItem value="urgent">Urgente</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Section Configuration supplémentaire */}
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">Configuration</h3>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="ticket-team" className="font-medium text-sm">Équipe</Label>
                <Select value={selectedTeamId} onValueChange={setSelectedTeamId}>
                  <SelectTrigger id="ticket-team">
                    <SelectValue placeholder="Sélectionner une équipe" />
                  </SelectTrigger>
                  <SelectContent>
                    {teams.length > 0 ? (
                      teams.map((team) => (
                        <SelectItem key={team._id} value={team._id}>
                          {team.name} ({team.members?.length || 0})
                        </SelectItem>
                      ))
                    ) : (
                      <div className="px-2 py-1.5 text-sm text-muted-foreground">
                        Aucune équipe disponible
                      </div>
                    )}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="ticket-estimated-date" className="font-medium text-sm">Date d'estimation</Label>
                <Input
                  id="ticket-estimated-date"
                  type="date"
                  value={estimatedDate}
                  onChange={(e) => setEstimatedDate(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
          </div>

          {/* Divider */}
          <div className="border-t border-border"></div>

          {/* Section Assignés */}
          <div className="space-y-3">
            <div className="flex items-baseline gap-2">
              <h3 className="text-sm font-semibold text-foreground">Assignés</h3>
              <span className="text-xs text-muted-foreground">Optionnel</span>
            </div>

            {members && members.length > 0 ? (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  Membres du projet
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {members.map((member) => {
                    return (
                      <label
                        key={member.id}
                        className="flex items-center gap-3 p-2.5 rounded-md hover:bg-secondary/50 cursor-pointer transition-colors border border-transparent hover:border-border/50"
                      >
                        <input
                          type="checkbox"
                          checked={assigneeIds.includes(member.id)}
                          onChange={(e) => {
                            if (e.target.checked) {
                              setAssigneeIds([...assigneeIds, member.id]);
                            } else {
                              setAssigneeIds(assigneeIds.filter(id => id !== member.id));
                            }
                          }}
                          className="w-4 h-4 rounded cursor-pointer"
                        />
                        <div className="flex flex-col flex-1 min-w-0">
                          <span className="text-sm font-medium text-foreground truncate">{member.fullName}</span>
                          <span className="text-xs text-muted-foreground truncate">{member.email}</span>
                        </div>
                      </label>
                    );
                  })
                }
                </div>
              </div>
            ) : selectedTeamId ? (
              <div className="space-y-3">
                <div className="text-xs font-medium text-muted-foreground">
                  {teams.find(t => t._id === selectedTeamId)?.name || 'Équipe'}
                </div>
                <div className="space-y-1 max-h-48 overflow-y-auto pr-2">
                  {teamMembers.length > 0 ? (
                    teamMembers.map((member) => {
                      const userIdKey = typeof member.userId === 'string' ? member.userId : (member.userId?._id || member._id);
                      const memberKey = userIdKey || member.email;
                      const invitationStatus = userIdKey ? invitationStatuses[userIdKey] : null;
                      const isDisabled = !userIdKey || invitationStatus === 'pending' || invitationStatus === 'rejected';

                      return (
                        <label
                          key={memberKey}
                          className={`flex items-center gap-3 p-2.5 rounded-md transition-colors border border-transparent ${
                            isDisabled
                              ? 'opacity-50 cursor-not-allowed'
                              : 'hover:bg-secondary/50 cursor-pointer hover:border-border/50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={userIdKey ? assigneeIds.includes(userIdKey) : false}
                            onChange={(e) => {
                              if (userIdKey) {
                                if (e.target.checked) {
                                  setAssigneeIds([...assigneeIds, userIdKey]);
                                } else {
                                  setAssigneeIds(assigneeIds.filter(id => id !== userIdKey));
                                }
                              }
                            }}
                            disabled={isDisabled}
                            className="w-4 h-4 rounded cursor-pointer"
                          />
                          <div className="flex-1">
                            <TeamMemberStatusCard
                              member={member}
                              invitationStatus={invitationStatus}
                            />
                          </div>
                        </label>
                      );
                    })
                  ) : (
                    <div className="text-sm text-muted-foreground py-6 text-center bg-muted/30 rounded-md">
                      Aucun membre dans cette équipe
                    </div>
                  )}
                </div>
                {assigneeIds.length > 0 && (
                  <div className="mt-4 pt-3 border-t border-border">
                    <p className="text-xs font-semibold text-foreground mb-2">
                      Assignés sélectionnés <span className="text-muted-foreground font-normal">({assigneeIds.length})</span>
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {assigneeIds.map((id) => {
                        // Try to find in project members first
                        const projectMember = members?.find(m => m.id === id);
                        if (projectMember) {
                          return (
                            <div key={id} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full text-xs">
                              <span className="font-medium text-primary">{projectMember.fullName}</span>
                              <button
                                type="button"
                                onClick={() => setAssigneeIds(assigneeIds.filter(aid => aid !== id))}
                                className="hover:text-destructive text-primary/70 transition-colors"
                                aria-label={`Remove ${projectMember.fullName}`}
                              >
                                ×
                              </button>
                            </div>
                          );
                        }

                        // Fallback to team members
                        const teamMember = teamMembers.find(m => {
                          const userIdKey = typeof m.userId === 'string' ? m.userId : (m.userId?._id || m._id);
                          return userIdKey === id;
                        });
                        return teamMember ? (
                          <div key={id} className="inline-flex items-center gap-1.5 bg-primary/10 border border-primary/20 px-2.5 py-1 rounded-full text-xs">
                            <span className="font-medium text-primary">{teamMember.firstName} {teamMember.lastName}</span>
                            <button
                              type="button"
                              onClick={() => setAssigneeIds(assigneeIds.filter(aid => aid !== id))}
                              className="hover:text-destructive text-primary/70 transition-colors"
                              aria-label={`Remove ${teamMember.firstName} ${teamMember.lastName}`}
                            >
                              ×
                            </button>
                          </div>
                        ) : null;
                      })}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <div className="text-sm text-muted-foreground p-4 bg-muted/50 rounded-md text-center border border-border/50">
                Sélectionnez une équipe pour ajouter des assignés
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading || isReadOnly}>
              {isLoading ? 'Création...' : 'Créer le ticket'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
