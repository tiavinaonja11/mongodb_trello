import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';

interface Team {
  _id: string;
  name: string;
  description?: string;
  members?: any[];
}

interface EditTeamModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  team?: Team;
  onTeamUpdated?: () => void;
}

export const EditTeamModal = ({ open, onOpenChange, team, onTeamUpdated }: EditTeamModalProps) => {
  const { token } = useAuth();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (team) {
      setName(team.name);
      setDescription(team.description || '');
    }
  }, [team, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Le nom de l'équipe est requis");
      return;
    }

    if (!team) return;

    setIsLoading(true);

    try {
      const response = await fetch(`/api/teams/${team._id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: name.trim(),
          description: description.trim(),
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la modification');
      }

      toast.success('Équipe modifiée avec succès!');
      onOpenChange(false);
      onTeamUpdated?.();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la modification');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Modifier l'équipe</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="edit-team-name">Nom de l'équipe *</Label>
            <Input
              id="edit-team-name"
              type="text"
              placeholder="ex: Équipe Frontend"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={isLoading}
              autoFocus
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="edit-team-description">Description</Label>
            <Input
              id="edit-team-description"
              type="text"
              placeholder="ex: Responsable du développement frontend"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={isLoading}
            />
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Annuler
            </Button>
            <Button type="submit" variant="gradient" disabled={isLoading}>
              {isLoading ? 'Modification...' : 'Modifier'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
