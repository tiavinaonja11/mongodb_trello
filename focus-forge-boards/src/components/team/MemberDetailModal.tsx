import { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ConfirmationDialog } from '@/components/ui/confirmation-dialog';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { Trash2, Edit2, Mail, Phone as PhoneIcon } from 'lucide-react';
import { formatPhoneNumber, getInitials } from '@/lib/utils';

interface TeamMember {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: number;
  role: string;
  projectCount: number;
}

interface MemberDetailModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  member?: TeamMember;
  teamId?: string;
  onMemberUpdated?: () => void;
  onMemberDeleted?: () => void;
}

export const MemberDetailModal = ({
  open,
  onOpenChange,
  member,
  teamId,
  onMemberUpdated,
  onMemberDeleted,
}: MemberDetailModalProps) => {
  const { token } = useAuth();
  const [isEditing, setIsEditing] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [formData, setFormData] = useState<TeamMember | null>(null);

  useEffect(() => {
    if (open && member) {
      setFormData(member);
      setIsEditing(false);
    }
  }, [open, member]);

  const handleOpenChange = (newOpen: boolean) => {
    onOpenChange(newOpen);
  };

  const handleEdit = () => {
    setIsEditing(true);
  };

  const handleCancel = () => {
    setIsEditing(false);
    setFormData(member || null);
  };

  const handleSave = async () => {
    if (!formData || !member?._id || !teamId) return;

    if (!formData.firstName.trim() || !formData.lastName.trim()) {
      toast.error("Le prénom et nom sont requis");
      return;
    }

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/members/${member._id}`,
        {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
          },
          body: JSON.stringify({
            firstName: formData.firstName,
            lastName: formData.lastName,
            phone: formData.phone,
            role: formData.role,
          }),
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la mise à jour');
      }

      toast.success('Membre mis à jour avec succès!');
      setIsEditing(false);
      onMemberUpdated?.();
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la mise à jour');
    } finally {
      setIsLoading(false);
    }
  };

  const handleOpenDeleteConfirm = () => {
    setIsDeleteConfirmOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!member?._id || !teamId) return;

    setIsLoading(true);

    try {
      const response = await fetch(
        `/api/teams/${teamId}/members/${member._id}`,
        {
          method: 'DELETE',
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Erreur lors de la suppression');
      }

      toast.success('Membre supprimé avec succès!');
      onMemberDeleted?.();
      handleOpenChange(false);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Erreur lors de la suppression');
    } finally {
      setIsLoading(false);
    }
  };

  if (!member || !formData) return null;

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {isEditing ? 'Modifier le membre' : 'Détails du membre'}
            </DialogTitle>
          </DialogHeader>

          {!isEditing ? (
            <div className="space-y-5">
              {/* Member Avatar and Name */}
              <div className="flex items-center gap-4 pb-4 border-b border-border">
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-xl font-semibold text-primary">
                    {getInitials(member.firstName, member.lastName)}
                  </span>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-foreground">
                    {member.firstName} {member.lastName}
                  </h3>
                  <p className="text-sm text-muted-foreground capitalize">{member.role}</p>
                </div>
              </div>

              {/* Contact Information */}
              <div className="space-y-3">
                <div className="flex items-center gap-3 text-sm">
                  <Mail className="w-4 h-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-xs font-medium text-muted-foreground">Email</p>
                    <p className="text-foreground break-all">{member.email}</p>
                  </div>
                </div>
                {member.phone && (
                  <div className="flex items-center gap-3 text-sm">
                    <PhoneIcon className="w-4 h-4 text-muted-foreground shrink-0" />
                    <div>
                      <p className="text-xs font-medium text-muted-foreground">Téléphone</p>
                      <p className="text-foreground">{formatPhoneNumber(member.phone)}</p>
                    </div>
                  </div>
                )}
              </div>

              {/* Stats */}
              <div className="bg-secondary/30 rounded-lg p-3">
                <p className="text-sm text-muted-foreground">Projets assignés</p>
                <p className="text-xl font-semibold text-foreground">{member.projectCount}</p>
              </div>

              <DialogFooter className="gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => onOpenChange(false)}
                >
                  Fermer
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleEdit}
                  disabled={isLoading}
                >
                  <Edit2 className="w-4 h-4" />
                  Modifier
                </Button>
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleOpenDeleteConfirm}
                  disabled={isLoading}
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </Button>
              </DialogFooter>
            </div>
          ) : (
            <form onSubmit={(e) => { e.preventDefault(); handleSave(); }} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <Label htmlFor="edit-first-name">Prénom *</Label>
                  <Input
                    id="edit-first-name"
                    type="text"
                    value={formData.firstName}
                    onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="edit-last-name">Nom *</Label>
                  <Input
                    id="edit-last-name"
                    type="text"
                    value={formData.lastName}
                    onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                    disabled={isLoading}
                  />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-phone">Téléphone</Label>
                <Input
                  id="edit-phone"
                  type="tel"
                  placeholder="0612345678"
                  value={formData.phone ? String(formData.phone) : ''}
                  onChange={(e) => {
                    const digits = String(e.target.value).replace(/\D/g, '');
                    setFormData({ ...formData, phone: digits ? Number(digits) : undefined });
                  }}
                  disabled={isLoading}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="edit-role">Rôle</Label>
                <Select
                  value={formData.role}
                  onValueChange={(value) => setFormData({ ...formData, role: value })}
                  disabled={isLoading}
                >
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
                <Button type="button" variant="outline" onClick={handleCancel} disabled={isLoading}>
                  Annuler
                </Button>
                <Button type="submit" variant="gradient" disabled={isLoading}>
                  {isLoading ? 'Enregistrement...' : 'Enregistrer'}
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={isDeleteConfirmOpen}
        onOpenChange={setIsDeleteConfirmOpen}
        title="Supprimer le membre?"
        description={`Êtes-vous sûr de vouloir supprimer ${member.firstName} ${member.lastName} de l'équipe? Cette action ne peut pas être annulée.`}
        confirmText="Supprimer"
        cancelText="Annuler"
        isDangerous={true}
        isLoading={isLoading}
        onConfirm={handleConfirmDelete}
      />
    </>
  );
};
