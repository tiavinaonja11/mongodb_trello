import { useState, useEffect } from 'react';
import { Plus, Search, Mail, Phone, Users, Edit2, Trash2 } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { InviteMemberModal } from '@/components/team/InviteMemberModal';
import { MemberDetailModal } from '@/components/team/MemberDetailModal';
import { CreateTeamModal } from '@/components/team/CreateTeamModal';
import { EditTeamModal } from '@/components/team/EditTeamModal';
import { useTeams } from '@/hooks/use-teams';
import { formatPhoneNumber, getInitials } from '@/lib/utils';
import { toast } from 'sonner';

interface TeamMember {
  _id?: string;
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

const TeamPage = () => {
  const { teams, loading, deleteTeam, getProjectParticipants } = useTeams();
  const [selectedTeamId, setSelectedTeamId] = useState<string | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [isDetailOpen, setIsDetailOpen] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [selectedMember, setSelectedMember] = useState<TeamMember | null>(null);
  const [selectedTeamToEdit, setSelectedTeamToEdit] = useState<Team | null>(null);
  const [teamToDelete, setTeamToDelete] = useState<Team | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [isDeletingTeam, setIsDeletingTeam] = useState(false);
  const [projectParticipants, setProjectParticipants] = useState<TeamMember[]>([]);
  const [loadingParticipants, setLoadingParticipants] = useState(false);
  const [activeTab, setActiveTab] = useState<'teams' | 'participants'>('participants');

  // Load project participants on mount
  const fetchProjectParticipants = async () => {
    try {
      setLoadingParticipants(true);
      const participants = await getProjectParticipants();
      setProjectParticipants(participants);
    } catch (error) {
      console.error('Error loading participants:', error);
      setProjectParticipants([]);
    } finally {
      setLoadingParticipants(false);
    }
  };

  // Fetch participants on component mount
  useEffect(() => {
    fetchProjectParticipants();
  }, []);

  // Initialize selected team on first load
  if (!selectedTeamId && teams.length > 0 && !loading) {
    setSelectedTeamId(teams[0]._id);
  }

  const handleTeamCreated = () => {
    setIsCreateOpen(false);
    if (teams.length > 0 && !selectedTeamId) {
      setSelectedTeamId(teams[0]._id);
    }
  };

  const handleMemberAdded = () => {
    setIsInviteOpen(false);
  };

  const handleMemberClick = (member: TeamMember) => {
    setSelectedMember(member);
    setIsDetailOpen(true);
  };

  const handleMemberUpdated = () => {
    setIsDetailOpen(false);
  };

  const handleMemberDeleted = () => {
    setIsDetailOpen(false);
  };

  const handleEditTeam = (team: Team) => {
    setSelectedTeamToEdit(team);
    setIsEditOpen(true);
  };

  const handleTeamUpdated = () => {
    setIsEditOpen(false);
  };

  const openDeleteConfirmation = (team: Team) => {
    setTeamToDelete(team);
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!teamToDelete) return;

    setIsDeletingTeam(true);
    try {
      await deleteTeam(teamToDelete._id);
      toast.success('Équipe supprimée avec succès');
      
      // Reset selection if deleted team was selected
      if (selectedTeamId === teamToDelete._id) {
        setSelectedTeamId(teams.length > 1 ? teams[0]._id : null);
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsDeletingTeam(false);
      setIsDeleteConfirmOpen(false);
      setTeamToDelete(null);
    }
  };

  const currentTeam = teams.find((t) => t._id === selectedTeamId);
  const filteredMembers = currentTeam?.members?.filter((member) =>
    `${member.firstName} ${member.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    member.email.toLowerCase().includes(searchTerm.toLowerCase())
  ) || [];

  const memberCount = currentTeam?.members?.length || 0;

  return (
    <MainLayout>
      <div className="space-y-8 animate-fade-in">
        {/* Page Header */}
        <div className="flex flex-col gap-4">
          <div>
            <h1 className="text-3xl font-bold text-foreground">Équipes</h1>
            <p className="text-muted-foreground mt-1">
              Créez et gérez vos équipes, invitez des membres et organisez votre travail.
            </p>
          </div>
          <div className="flex gap-3 flex-col sm:flex-row">
            <Button
              variant="outline"
              onClick={() => setIsCreateOpen(true)}
              className="gap-2"
            >
              <Plus className="w-4 h-4" />
              Créer une équipe
            </Button>
            {activeTab === 'teams' && (
              <Button
                variant="gradient"
                onClick={() => setIsInviteOpen(true)}
                disabled={!selectedTeamId}
                className="gap-2"
              >
                <Plus className="w-4 h-4" />
                Inviter un membre
              </Button>
            )}
          </div>
        </div>

        {/* Tabs for viewing participants or teams */}
        {(projectParticipants.length > 0 || teams.length > 0) && (
          <div className="border-b border-border">
            <div className="flex gap-4">
              <button
                onClick={() => setActiveTab('participants')}
                className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${
                  activeTab === 'participants'
                    ? 'border-primary text-primary'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                Participants des projets
                {projectParticipants.length > 0 && (
                  <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {projectParticipants.length}
                  </span>
                )}
              </button>
              {teams.length > 0 && (
                <button
                  onClick={() => setActiveTab('teams')}
                  className={`pb-3 px-1 font-medium text-sm transition-colors border-b-2 ${
                    activeTab === 'teams'
                      ? 'border-primary text-primary'
                      : 'border-transparent text-muted-foreground hover:text-foreground'
                  }`}
                >
                  Équipes
                  <span className="ml-2 text-xs bg-secondary px-2 py-0.5 rounded-full">
                    {teams.length}
                  </span>
                </button>
              )}
            </div>
          </div>
        )}

        {/* Participants Tab */}
        {activeTab === 'participants' && (
          <div className="space-y-4">
            <div>
              <h2 className="text-lg font-semibold text-foreground mb-1">Participants des projets</h2>
              <p className="text-sm text-muted-foreground">
                Tous les utilisateurs qui ont participé à vos projets sont affichés automatiquement
              </p>
            </div>

            {loadingParticipants ? (
              <div className="text-center py-8">
                <div className="inline-flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-primary border-t-transparent rounded-full animate-spin"></div>
                  <span className="text-muted-foreground">Chargement des participants...</span>
                </div>
              </div>
            ) : projectParticipants.length > 0 ? (
              <>
                {/* Search */}
                {projectParticipants.length > 0 && (
                  <div className="relative max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder="Chercher un participant..."
                      className="pl-10 h-9"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                    />
                  </div>
                )}

                {/* Participants Grid */}
                {projectParticipants.length > 0 ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {projectParticipants
                      .filter(
                        (participant) =>
                          `${participant.firstName} ${participant.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          participant.email.toLowerCase().includes(searchTerm.toLowerCase())
                      )
                      .map((participant, index) => (
                        <div
                          key={participant._id || participant.email}
                          className="group ticket-card p-5 cursor-pointer transition-all hover:shadow-md"
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Participant Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                              <span className="font-semibold text-primary">
                                {getInitials(participant.firstName, participant.lastName)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {participant.firstName} {participant.lastName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-medium">
                                  {participant.projectCount} projet{participant.projectCount > 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {participant.role}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="border-t border-border/50 pt-3">
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="truncate text-xs sm:text-sm">{participant.email}</span>
                            </div>
                          </div>

                          {/* Hover Indicator */}
                          <div className="mt-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            Participant actif
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <div className="text-center py-12">
                    <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                    <p className="text-muted-foreground">
                      Aucun participant ne correspond à votre recherche
                    </p>
                  </div>
                )}
              </>
            ) : (
              <div className="text-center py-12">
                <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                <p className="text-muted-foreground">Aucun participant trouvé</p>
                <p className="text-xs text-muted-foreground mt-1">
                  Invitez des membres à vos projets pour les voir apparaître ici
                </p>
              </div>
            )}
          </div>
        )}

        {/* Teams Tab */}
        {activeTab === 'teams' && (
          <>
            {/* Teams Section */}
            <div className="space-y-3">
              <div>
                <h2 className="text-sm font-semibold text-foreground mb-1">Équipes disponibles</h2>
                <p className="text-xs text-muted-foreground">
                  Vous avez {teams.length} équipe{teams.length > 1 ? 's' : ''}
                </p>
              </div>
              <div className="flex flex-wrap gap-2">
                {teams.map((team) => (
                  <div key={team._id} className="flex items-center gap-1.5 group">
                    <Button
                      variant={selectedTeamId === team._id ? 'default' : 'outline'}
                      onClick={() => setSelectedTeamId(team._id)}
                      className="gap-2"
                      title={`${team.name} - ${team.members?.length || 0} membre${(team.members?.length || 0) > 1 ? 's' : ''}`}
                    >
                      <Users className="w-4 h-4" />
                      <span>{team.name}</span>
                      <Badge variant="secondary" className="ml-1 text-xs">
                        {team.members?.length || 0}
                      </Badge>
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleEditTeam(team)}
                      title="Modifier l'équipe"
                      className="h-9 w-9 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Edit2 className="w-4 h-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => openDeleteConfirmation(team)}
                      title="Supprimer l'équipe"
                      className="h-9 w-9 text-destructive hover:text-destructive opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
              </div>
            </div>

            {currentTeam && (
              <>
                {/* Current Team Info */}
                <div className="border-t border-border pt-8">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <h2 className="text-2xl font-bold text-foreground">{currentTeam.name}</h2>
                      <p className="text-muted-foreground text-sm mt-1">
                        {memberCount} membre{memberCount > 1 ? 's' : ''} dans cette équipe
                      </p>
                    </div>
                  </div>
                </div>

                {/* Members Section */}
                <div className="space-y-4">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                    <div>
                      <h3 className="text-sm font-semibold text-foreground">Membres</h3>
                      <p className="text-xs text-muted-foreground mt-0.5">
                        {filteredMembers.length} de {memberCount} membre{memberCount > 1 ? 's' : ''}
                      </p>
                    </div>
                    {memberCount > 0 && (
                      <div className="relative max-w-sm">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input
                          placeholder="Chercher un membre..."
                          className="pl-10 h-9"
                          value={searchTerm}
                          onChange={(e) => setSearchTerm(e.target.value)}
                        />
                      </div>
                    )}
                  </div>

                  {/* Members Grid */}
                  {filteredMembers.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                      {filteredMembers.map((member, index) => (
                        <div
                          key={member._id || member.email}
                          className="group ticket-card p-5 cursor-pointer transition-all hover:shadow-md"
                          onClick={() => handleMemberClick(member)}
                          style={{ animationDelay: `${index * 50}ms` }}
                        >
                          {/* Member Header */}
                          <div className="flex items-start gap-4 mb-4">
                            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                              <span className="font-semibold text-primary">
                                {getInitials(member.firstName, member.lastName)}
                              </span>
                            </div>
                            <div className="flex-1 min-w-0">
                              <h4 className="font-semibold text-foreground group-hover:text-primary transition-colors">
                                {member.firstName} {member.lastName}
                              </h4>
                              <div className="flex items-center gap-2 mt-1.5 flex-wrap">
                                <Badge variant="secondary" className="text-xs font-medium">
                                  {member.projectCount} projet{member.projectCount > 1 ? 's' : ''}
                                </Badge>
                                <Badge variant="outline" className="text-xs capitalize">
                                  {member.role}
                                </Badge>
                              </div>
                            </div>
                          </div>

                          {/* Contact Info */}
                          <div className="border-t border-border/50 pt-3 space-y-2">
                            <div className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                              <Mail className="w-4 h-4 shrink-0" />
                              <span className="truncate text-xs sm:text-sm">{member.email}</span>
                            </div>
                            {member.phone && (
                              <div className="flex items-center gap-2.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                <Phone className="w-4 h-4 shrink-0" />
                                <span className="text-xs sm:text-sm">{formatPhoneNumber(member.phone)}</span>
                              </div>
                            )}
                          </div>

                          {/* Hover Indicator */}
                          <div className="mt-3 text-xs text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity">
                            Cliquez pour modifier
                          </div>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-12">
                      <Users className="w-10 h-10 text-muted-foreground/50 mx-auto mb-3" />
                      <p className="text-muted-foreground">
                        {searchTerm
                          ? 'Aucun membre ne correspond à votre recherche'
                          : 'Aucun membre dans cette équipe'}
                      </p>
                      {searchTerm && (
                        <Button
                          variant="ghost"
                          onClick={() => setSearchTerm('')}
                          className="mt-2 text-xs"
                        >
                          Réinitialiser la recherche
                        </Button>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {/* Modals */}
      <CreateTeamModal
        open={isCreateOpen}
        onOpenChange={setIsCreateOpen}
        onTeamCreated={handleTeamCreated}
      />

      <InviteMemberModal
        open={isInviteOpen}
        onOpenChange={setIsInviteOpen}
        teamId={selectedTeamId || undefined}
        onMemberAdded={handleMemberAdded}
      />

      <MemberDetailModal
        open={isDetailOpen}
        onOpenChange={setIsDetailOpen}
        member={selectedMember || undefined}
        teamId={selectedTeamId || undefined}
        onMemberUpdated={handleMemberUpdated}
        onMemberDeleted={handleMemberDeleted}
      />

      <EditTeamModal
        open={isEditOpen}
        onOpenChange={setIsEditOpen}
        team={selectedTeamToEdit || undefined}
        onTeamUpdated={handleTeamUpdated}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Supprimer l'équipe?"
        description={`Êtes-vous sûr de vouloir supprimer "${teamToDelete?.name}"? Cette action ne peut pas être annulée. Tous les membres seront conservés mais l'équipe sera supprimée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        isLoading={isDeletingTeam}
        onConfirm={handleConfirmDelete}
      />
    </MainLayout>
  );
};

export default TeamPage;
