import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { X, Plus, Copy, CheckCircle } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

interface InviteToProjectModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  projectId: string;
  projectName: string;
  onInviteSent?: () => void;
}

interface ProjectMember {
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
}

interface InvitationResult {
  email: string;
  success: boolean;
  invitationUrl?: string;
}

export const InviteToProjectModal = ({
  open,
  onOpenChange,
  projectId,
  projectName,
  onInviteSent,
}: InviteToProjectModalProps) => {
  const { token } = useAuth();
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteFirstName, setInviteFirstName] = useState('');
  const [inviteLastName, setInviteLastName] = useState('');
  const [inviteRole, setInviteRole] = useState<'member' | 'admin'>('member');
  const [members, setMembers] = useState<ProjectMember[]>([]);
  const [isInviting, setIsInviting] = useState(false);
  const [invitationResults, setInvitationResults] = useState<InvitationResult[]>([]);

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

  const handleInviteMembers = async () => {
    if (members.length === 0) {
      toast.error('Veuillez ajouter au moins un membre');
      return;
    }

    setIsInviting(true);
    const results: InvitationResult[] = [];

    try {
      let successCount = 0;

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

        const data = await response.json();

        if (!response.ok) {
          toast.error(`Erreur pour ${member.email}: ${data.message}`);
          results.push({ email: member.email, success: false });
        } else {
          toast.success(`Invitation envoyée à ${member.email}`);
          results.push({
            email: member.email,
            success: data.emailSent || false,
            invitationUrl: data.invitationUrl,
          });
          successCount++;
        }
      }

      if (successCount > 0) {
        setInvitationResults(results);
        // Don't close yet, show results
      }
    } catch (error) {
      toast.error('Erreur lors de l\'envoi des invitations');
      console.error('Error inviting members:', error);
    } finally {
      setIsInviting(false);
    }
  };

  const finishInvitation = () => {
    setMembers([]);
    setInviteEmail('');
    setInviteFirstName('');
    setInviteLastName('');
    setInviteRole('member');
    setInvitationResults([]);
    onOpenChange(false);

    if (onInviteSent) {
      onInviteSent();
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Lien copié dans le presse-papiers');
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Inviter des membres</DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800">
            <p className="font-medium mb-1">ℹ️ Projet: {projectName}</p>
            <p>Les membres invités recevront un email avec un lien pour rejoindre le projet.</p>
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
              <div className="space-y-2 max-h-48 overflow-y-auto">
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

          {/* Results Display */}
          {invitationResults.length > 0 && (
            <div className="space-y-3">
              <div className="border-t border-border pt-4">
                <h3 className="font-medium text-sm mb-3">Résultats des invitations</h3>
                <div className="space-y-3 max-h-64 overflow-y-auto">
                  {invitationResults.map((result) => (
                    <div key={result.email} className="space-y-2">
                      <div className="flex items-start gap-2 p-3 rounded-lg border border-border bg-muted/30">
                        <div className="flex-1">
                          <p className="font-medium text-sm">{result.email}</p>
                          {result.success ? (
                            <p className="text-xs text-green-600 flex items-center gap-1 mt-1">
                              <CheckCircle className="w-3 h-3" /> Email envoyé
                            </p>
                          ) : (
                            <p className="text-xs text-orange-600 mt-1">
                              ℹ️ Email non envoyé - partagez le lien manuellement
                            </p>
                          )}
                        </div>
                      </div>

                      {result.invitationUrl && !result.success && (
                        <div className="pl-3 space-y-2">
                          <p className="text-xs font-medium text-muted-foreground">Lien d'invitation:</p>
                          <div className="flex gap-2">
                            <code className="flex-1 text-xs bg-muted p-2 rounded border border-border overflow-auto break-all max-h-20">
                              {result.invitationUrl}
                            </code>
                            <Button
                              size="icon"
                              variant="outline"
                              onClick={() => copyToClipboard(result.invitationUrl)}
                              className="flex-shrink-0"
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          <DialogFooter className="gap-2 sm:gap-0">
            {invitationResults.length > 0 ? (
              <Button
                type="button"
                variant="gradient"
                onClick={finishInvitation}
                className="w-full"
              >
                Terminer
              </Button>
            ) : (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                  disabled={isInviting}
                >
                  Annuler
                </Button>
                <Button
                  type="button"
                  variant="gradient"
                  onClick={handleInviteMembers}
                  disabled={isInviting || members.length === 0}
                >
                  {isInviting ? 'Envoi...' : 'Envoyer invitations'}
                </Button>
              </>
            )}
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
};
