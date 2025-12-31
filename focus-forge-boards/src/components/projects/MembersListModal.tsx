import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Mail, User } from 'lucide-react';
import { cn } from '@/lib/utils';

interface Member {
  id: string;
  fullName: string;
  email: string;
}

interface MembersListModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  members: Member[];
  projectName: string;
}

export const MembersListModal = ({
  open,
  onOpenChange,
  members,
  projectName,
}: MembersListModalProps) => {
  const getInitials = (fullName: string) => {
    const parts = fullName.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-lg">Membres du projet</DialogTitle>
          <p className="text-sm text-muted-foreground mt-1">{projectName}</p>
        </DialogHeader>

        <div className="space-y-3 max-h-96 overflow-y-auto">
          {members.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-8">
              Aucun membre dans ce projet
            </p>
          ) : (
            members.map((member) => (
              <div
                key={member.id}
                className="flex items-center gap-3 p-3 rounded-lg hover:bg-muted/50 transition-colors border border-border/50"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center shrink-0">
                  <span className="text-xs font-semibold text-primary">
                    {getInitials(member.fullName)}
                  </span>
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground truncate">
                    {member.fullName}
                  </p>
                  <div className="flex items-center gap-1 mt-1">
                    <Mail className="w-3.5 h-3.5 text-muted-foreground shrink-0" />
                    <p className="text-xs text-muted-foreground truncate">
                      {member.email}
                    </p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {members.length > 0 && (
          <div className="text-xs text-muted-foreground text-center pt-2 border-t border-border">
            {members.length} {members.length === 1 ? 'membre' : 'membres'}
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};
