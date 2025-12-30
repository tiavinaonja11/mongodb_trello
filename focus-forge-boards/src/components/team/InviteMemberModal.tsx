import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface InviteMemberModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  teamId?: string;
  onMemberAdded?: () => void;
}

export const InviteMemberModal = ({ open, onOpenChange, teamId, onMemberAdded }: InviteMemberModalProps) => {
  const { token } = useAuth();
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('member');
  const [isLoading, setIsLoading] = useState(false);
  const [invitationUrl, setInvitationUrl] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!email.trim()) {
      toast.error("L'email est requis");
      return;
    }

    if (!firstName.trim() || !lastName.trim()) {
      toast.error("Le prénom et nom sont requis");
      return;
    }

    if (!email.includes('@')) {
      toast.error("Veuillez entrer un email valide");
      return;
    }

    setIsLoading(true);

    try {
      if (teamId) {
        const response = await fetch(`/api/teams/${teamId}/members`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            email,
            firstName,
            lastName,
            phone: phone ? Number(String(phone).replace(/\D/g, '')) : undefined,
            role,
            projectCount: 0,
          }),
        });

        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.message || 'Failed to add member');
        }

        const data = await response.json();

        // Show invitation URL
        if (data.data?.invitationUrl) {
          setInvitationUrl(data.data.invitationUrl);
          toast.success(`Invitation créée! Partagez le lien avec ${firstName} ${lastName}`);
        } else {
          toast.success(`Invitation envoyée à ${email}!`);
          setEmail('');
          setFirstName('');
          setLastName('');
          setPhone('');
          setRole('member');
          onOpenChange(false);
          onMemberAdded?.();
        }
      } else {
        toast.error("Aucune équipe sélectionnée");
      }
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de l\'ajout du membre');
    } finally {
      setIsLoading(false);
    }
  };

  if (invitationUrl) {
    return (
      <Dialog open={open} onOpenChange={(newOpen) => {
        if (!newOpen) {
          setInvitationUrl(null);
          setEmail('');
          setFirstName('');
          setLastName('');
          setPhone('');
          setRole('member');
        }
        onOpenChange(newOpen);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Invitation créée et envoyée!</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <p className="text-sm font-medium text-green-900 mb-2">✅ Email envoyé</p>
              <p className="text-sm text-green-800">
                Une invitation a été envoyée à <strong>{email}</strong>. {firstName} {lastName} peut cliquer sur le lien dans l'email pour créer son compte et rejoindre l'équipe.
              </p>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
              <p className="text-xs font-medium text-blue-900 mb-1">💡 Information</p>
              <p className="text-xs text-blue-800">
                Si l'email n'arrive pas, vous pouvez partager ce lien manuellement:
              </p>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Lien d'invitation (backup)</label>
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={invitationUrl}
                  className="flex-1 px-3 py-2 border border-border rounded-lg bg-muted text-xs"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    navigator.clipboard.writeText(invitationUrl);
                    setCopied(true);
                    toast.success('Lien copié!');
                    setTimeout(() => setCopied(false), 2000);
                  }}
                  size="sm"
                >
                  {copied ? 'Copié!' : 'Copier'}
                </Button>
              </div>
            </div>

            <Button
              className="w-full"
              variant="gradient"
              onClick={() => {
                setInvitationUrl(null);
                setEmail('');
                setFirstName('');
                setLastName('');
                setPhone('');
                setRole('member');
                onOpenChange(false);
                onMemberAdded?.();
              }}
            >
              Terminé
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Inviter un membre</DialogTitle>
        </DialogHeader>
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 text-sm text-blue-800 mb-4">
          <p className="font-medium mb-1">ℹ️ Information</p>
          <p>L'utilisateur recevra un lien d'invitation pour créer son compte et rejoindre l'équipe.</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="member-email">Email *</Label>
            <Input
              id="member-email"
              type="email"
              placeholder="exemple@email.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="member-first-name">Prénom *</Label>
              <Input
                id="member-first-name"
                type="text"
                placeholder="Jean"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="member-last-name">Nom *</Label>
              <Input
                id="member-last-name"
                type="text"
                placeholder="Dupont"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                disabled={isLoading}
              />
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-phone">Téléphone</Label>
            <Input
              id="member-phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="member-role">Rôle</Label>
            <Select value={role} onValueChange={setRole} disabled={isLoading}>
              <SelectTrigger>
                <SelectValue placeholder="Sélectionner un rôle" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="admin">Administrateur</SelectItem>
                <SelectItem value="member">Membre</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading ? 'Envoi...' : 'Envoyer l\'invitation'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
