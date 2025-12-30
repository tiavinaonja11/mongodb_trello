import { useState } from 'react';
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, MessageSquare, Users, Trash2 } from 'lucide-react';
import { Ticket, TicketStatus } from '@/types';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';
import { useTickets } from '@/hooks/use-tickets';
import { toast } from 'sonner';

interface TicketCardProps {
  ticket: Ticket;
  onClick?: () => void;
  projectId?: string;
  onTicketDeleted?: () => void;
  isReadOnly?: boolean;
}

const statusColors: Record<TicketStatus, string> = {
  todo: 'bg-status-todo',
  in_progress: 'bg-status-progress',
  review: 'bg-status-review',
  done: 'bg-status-done',
};

export function TicketCard({ ticket, onClick, projectId, onTicketDeleted, isReadOnly = false }: TicketCardProps) {
  const { user } = useAuth();
  const { deleteTicket } = useTickets(projectId || '');
  const [isDeleting, setIsDeleting] = useState(false);

  const isOverdue = ticket.estimatedDate && new Date(ticket.estimatedDate) < new Date() && ticket.status !== 'done';

  // Compare creatorId - handle both object and string formats
  const creatorId = typeof ticket.creatorId === 'object' ? (ticket.creatorId._id || ticket.creatorId.id) : ticket.creatorId;
  const isCreator = creatorId === user?.id;

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleDeleteTicket = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteTicket(ticket.id);
      toast.success('Ticket supprimé avec succès');
      if (onTicketDeleted) {
        onTicketDeleted();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div
      onClick={onClick}
      className="ticket-card p-4 cursor-pointer group animate-fade-in relative"
    >
      {/* Delete button */}
      {!isReadOnly && (
        <button
          onClick={handleDeleteTicket}
          disabled={isDeleting || !isCreator}
          className={cn(
            "absolute top-2 right-2 p-1.5 rounded transition-all duration-200",
            isCreator
              ? "bg-destructive/10 hover:bg-destructive/20 opacity-100 cursor-pointer"
              : "opacity-0 pointer-events-none"
          )}
          title={isCreator ? "Supprimer le ticket" : "Vous n'êtes pas le créateur"}
        >
          <Trash2 className="w-4 h-4 text-destructive" />
        </button>
      )}

      {/* Status indicator */}
      <div className="flex items-center gap-2 mb-3">
        <div className={cn("w-2 h-2 rounded-full", statusColors[ticket.status])} />
        <span className="text-xs text-muted-foreground">#{ticket.id}</span>
      </div>

      {/* Title */}
      <h4 className="font-medium text-foreground mb-2 group-hover:text-primary transition-colors line-clamp-2">
        {ticket.title}
      </h4>

      {/* Description */}
      {ticket.description && (
        <p className="text-sm text-muted-foreground mb-4 line-clamp-2">
          {ticket.description}
        </p>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between pt-3 border-t border-border/50">
        {/* Date */}
        {ticket.estimatedDate && (
          <div className={cn(
            "flex items-center gap-1.5 text-xs",
            isOverdue ? "text-destructive" : "text-muted-foreground"
          )}>
            <Calendar className="w-3.5 h-3.5" />
            <span>{format(new Date(ticket.estimatedDate), 'd MMM', { locale: fr })}</span>
          </div>
        )}
        {!ticket.estimatedDate && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Calendar className="w-3.5 h-3.5" />
            <span>Sans date</span>
          </div>
        )}

        <div className="flex items-center gap-3">
          {/* Comments count */}
          {ticket.commentsCount && ticket.commentsCount > 0 && (
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MessageSquare className="w-3.5 h-3.5" />
              <span>{ticket.commentsCount}</span>
            </div>
          )}

          {/* Assignees */}
          {ticket.assignees && Array.isArray(ticket.assignees) && ticket.assignees.length > 0 && (
            <div className="flex -space-x-2">
              {ticket.assignees.slice(0, 3).map((assignee, idx) => {
                const fullName = assignee?.fullName || assignee?.name || assignee?.email || 'Unknown';
                const assigneeId = assignee?._id || assignee?.id || idx.toString();
                const projectCount = assignee?.projectCount || 0;
                const tooltipText = `${fullName}${projectCount ? ` (${projectCount} projet${projectCount !== 1 ? 's' : ''})` : ''}`;
                return (
                  <div
                    key={assigneeId}
                    className="w-6 h-6 rounded-full bg-secondary border-2 border-card flex items-center justify-center"
                    title={tooltipText}
                  >
                    <span className="text-[10px] font-medium text-secondary-foreground">
                      {getInitials(fullName)}
                    </span>
                  </div>
                );
              })}
              {ticket.assignees.length > 3 && (
                <div className="w-6 h-6 rounded-full bg-muted border-2 border-card flex items-center justify-center">
                  <span className="text-[10px] font-medium text-muted-foreground">
                    +{ticket.assignees.length - 3}
                  </span>
                </div>
              )}
            </div>
          )}

          {(!ticket.assignees || ticket.assignees.length === 0) && (
            <div className="w-6 h-6 rounded-full bg-muted/50 border-2 border-dashed border-muted-foreground/30 flex items-center justify-center">
              <Users className="w-3 h-3 text-muted-foreground/50" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
