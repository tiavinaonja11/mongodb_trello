import { CheckCircle, Clock, XCircle } from 'lucide-react';

interface TeamMemberStatusCardProps {
  member: {
    _id?: string;
    userId?: string | { _id: string };
    email: string;
    firstName: string;
    lastName: string;
    role: string;
    projectCount: number;
  };
  invitationStatus?: 'pending' | 'accepted' | 'rejected' | null;
}

export const TeamMemberStatusCard = ({ member, invitationStatus }: TeamMemberStatusCardProps) => {
  const userIdKey = typeof member.userId === 'string' ? member.userId : (member.userId?._id || member._id);
  
  const getStatusIcon = () => {
    if (invitationStatus === 'pending') {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    if (invitationStatus === 'rejected') {
      return <XCircle className="h-4 w-4 text-destructive" />;
    }
    if (userIdKey) {
      return <CheckCircle className="h-4 w-4 text-green-500" />;
    }
    return null;
  };

  const getStatusText = () => {
    if (invitationStatus === 'pending') {
      return 'Invitation en attente';
    }
    if (invitationStatus === 'rejected') {
      return 'Invitation refusée';
    }
    if (userIdKey) {
      return 'Membre confirmé';
    }
    return 'Pas d\'accès utilisateur';
  };

  return (
    <div className="flex items-center gap-3 p-2 rounded-lg hover:bg-secondary/50 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="text-sm font-medium">{member.firstName} {member.lastName}</div>
        <div className="text-xs text-muted-foreground">{member.email}</div>
        <div className="flex items-center gap-2 mt-1">
          {getStatusIcon()}
          <span className="text-xs text-muted-foreground">{getStatusText()}</span>
        </div>
      </div>
      {member.projectCount > 0 && (
        <div className="text-xs bg-primary/20 text-primary px-2 py-1 rounded whitespace-nowrap">
          {member.projectCount} proj.
        </div>
      )}
    </div>
  );
};
