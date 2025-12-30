import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { ProjectStatus } from '@/types';
import { useProjects } from '@/hooks/use-projects';
import { X, Plus } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface NewProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onProjectCreated?: () => void;
}

interface ProjectMember {
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
}

export const NewProjectModal = ({ open, onOpenChange, onProjectCreated }: NewProjectModalProps) => {
  const { createProject } = useProjects();
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [status, setStatus] = useState<ProjectStatus>('active');
  const [dueDate, setDueDate] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [step, setStep] = useState<'details' | 'invite'>('details');
  const [projectId, setProjectId] = useState('');

  // Member invite form
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isInviting, setIsInviting] = useState(false);

  const handleAddMember = () => {
    if (!inviteEmail.trim() || !inviteFirstName.trim() || !inviteLastName.trim()) {
      toast.error('Veuillez remplir tous les champs');
      return;
    }

    if (members.some(m => m.email === inviteEmail)) {
      toast.error('Cet email a déjà été ajouté');
      return;
    }

    setMembers([...members, {
      email: inviteEmail,
      firstName: inviteFirstName,
      lastName: inviteLastName,
      role: inviteRole,
    }]);

    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('member');
  };

  const handleRemoveMember = (email: string) => {
    setMembers(members.filter(m => m.email !== email));
  };

  const handleSubmitDetails = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error('Le nom du projet est requis');
      return;
    }

    if (dueDate && new Date(dueDate) < new Date()) {
      toast.error('La date limite ne peut pas être dans le passé');
      return;
    }

    setIsLoading(true);

    try {
      const project = await createProject(name, description, status, '', dueDate);
      setProjectId(project._id);
      setStep('invite');
    } catch (error) {
      toast.error('Erreur lors de la création du projet');
      console.error('Error creating project:', error);
      setIsLoading(false);
    }
  };

  const handleInviteMembers = async () => {
    if (members.length === 0) {
      // Skip invitations and finish
      finishCreation();
      return;
    }

    setIsInviting(true);

    try {
      for (const member of members) {
        const response = await fetch(`/api/projects/${projectId}/invite`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email: member.email,
            firstName: member.firstName,
            lastName: member.lastName,
            role: member.role,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          toast.error(`Erreur pour ${member.email}: ${data.message}`);
        } else {
          toast.success(`Invitation envoyée à ${member.email}`);
        }
      }

      finishCreation();
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des invitations');
      console.error('Error inviting members:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const finishCreation = () => {
    toast.success(`Projet créé avec succès !`);

    // Reset form
    setName('');
    setDescription('');
    setStatus('active');
    setDueDate('');
    setMembers([]);
    setProjectId('');
    setStep('details');
    setIsLoading(false);
    onOpenChange(false);

    if (onProjectCreated) {
      onProjectCreated();
    }
  };

  const handleClose = () => {
    if (step === 'invite') {
      // Going back
      setStep('details');
      setProjectId('');
    } else {
      // Closing dialog
      setName('');
      setDescription('');
      setStatus('active');
      setDueDate('');
      setMembers([]);
      setProjectId('');
      setStep('details');
      setIsLoading(false);
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {step === 'details' ? 'Nouveau projet' : 'Inviter des membres'}
          </DialogTitle>
        </DialogHeader>

        {step === 'details' ? (
          <form onSubmit={handleSubmitDetails} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="project-name">Nom du projet *</Label>
              <Input
                id="project-name"
                placeholder="Ex: Refonte site web"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-description">Description</Label>
              <Textarea
                id="project-description"
                placeholder="Décrivez brièvement le projet..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                rows={3}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-status">Statut *</Label>
              <Select value={status} onValueChange={(value) => setStatus(value as ProjectStatus)}>
                <SelectTrigger id="project-status">
                  <SelectValue placeholder="Sélectionnez un statut" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Actif</SelectItem>
                  <SelectItem value="inactive">Inactif</SelectItem>
                  <SelectItem value="archived">Archivé</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="project-due-date">Date limite (optionnel)</Label>
              <Input
                id="project-due-date"
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isLoading}
              >
                Annuler
              </Button>
              <Button
                type="submit"
                variant="gradient"
                disabled={isLoading || !name.trim()}
              >
                {isLoading ? 'Création...' : 'Suivant'}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="space-y-4">
            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
              <p className="font-medium mb-1">ℹ️ Inviter des membres (optionnel)</p>
              <p>Vous pouvez inviter des membres maintenant ou plus tard.</p>
            </div>

            {/* Add Member Form */}
            <div className="space-y-3 p-4 bg-secondary/30 rounded-lg">
              <div className="space-y-2">
                <Label htmlFor="invite-email">Email</Label>
                <Input
                  id="invite-email"
                  type="email"
                  placeholder="exemple@email.com"
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <Label htmlFor="invite-first-name">Prénom</Label>
                  <Input
                    id="invite-first-name"
                    placeholder="Jean"
                    value={inviteFirstName}
                    onChange={(e) => setInviteFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="invite-last-name">Nom</Label>
                  <Input
                    id="invite-last-name"
                    placeholder="Dupont"
                    value={inviteLastName}
                    onChange={(e) => setInviteLastName(e.target.value)}
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="invite-role">Rôle</Label>
                <Select value={inviteRole} onValueChange={(value) => setInviteRole(value as 'member' | 'admin')}>
                  <SelectTrigger id="invite-role">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="member">Membre</SelectItem>
                    <SelectItem value="admin">Administrateur</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Button
                type="button"
                variant="outline"
                onClick={handleAddMember}
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                Ajouter un membre
              </Button>
            </div>

            {/* Members List */}
            {members.length > 0 && (
              <div className="space-y-2">
                <Label>Membres à inviter ({members.length})</Label>
                <div className="space-y-2">
                  {members.map((member) => (
                    <div
                      key={member.email}
                      className="flex items-center justify-between p-3 bg-secondary/50 rounded-lg"
                    >
                      <div>
                        <p className="font-medium text-sm">{member.firstName} {member.lastName}</p>
                        <p className="text-xs text-muted-foreground">{member.email}</p>
                        <p className="text-xs text-muted-foreground capitalize">{member.role}</p>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => handleRemoveMember(member.email)}
                        className="text-destructive hover:text-destructive"
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0">
              <Button
                type="button"
                variant="outline"
                onClick={() => setStep('details')}
                disabled={isInviting}
              >
                Retour
              </Button>
              <Button
                type="button"
                variant="gradient"
                onClick={handleInviteMembers}
                disabled={isInviting}
              >
                {isInviting ? 'Envoi...' : members.length > 0 ? 'Envoyer invitations' : 'Terminer'}
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
