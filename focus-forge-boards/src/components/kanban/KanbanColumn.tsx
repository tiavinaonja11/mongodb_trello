import { Plus } from 'lucide-react';
import { Ticket, TicketStatus, STATUS_LABELS } from '@/types';
import { TicketCard } from '@/components/tickets/TicketCard';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface KanbanColumnProps {
  status: TicketStatus;
  tickets: Ticket[];
  onTicketClick?: (ticket: Ticket) => void;
  onAddTicket?: () => void;
  isReadOnly?: boolean;
  projectId?: string;
  onTicketDeleted?: () => void;
}

const statusStyles: Record<TicketStatus, { bg: string; border: string; dot: string }> = {
  todo: {
    bg: 'bg-status-todo/10',
    border: 'border-status-todo/30',
    dot: 'bg-status-todo'
  },
  in_progress: {
    bg: 'bg-status-progress/10',
    border: 'border-status-progress/30',
    dot: 'bg-status-progress'
  },
  review: {
    bg: 'bg-status-review/10',
    border: 'border-status-review/30',
    dot: 'bg-status-review'
  },
  done: {
    bg: 'bg-status-done/10',
    border: 'border-status-done/30',
    dot: 'bg-status-done'
  },
};

export function KanbanColumn({ status, tickets, onTicketClick, onAddTicket, isReadOnly = false, projectId, onTicketDeleted }: KanbanColumnProps) {
  const style = statusStyles[status];

  return (
    <div className="kanban-column flex flex-col min-w-[300px] max-w-[300px] h-full">
      {/* Header */}
      <div className={cn("p-4 rounded-t-xl border-b", style.bg, style.border)}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={cn("w-3 h-3 rounded-full", style.dot)} />
            <h3 className="font-semibold text-foreground">{STATUS_LABELS[status]}</h3>
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {tickets.length}
            </span>
          </div>
          <Button
            variant="ghost"
            size="icon"
            className="w-8 h-8"
            onClick={onAddTicket}
            disabled={isReadOnly}
            title={isReadOnly ? 'Impossible d\'ajouter des tickets en lecture seule' : ''}
          >
            <Plus className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Tickets */}
      <div className="flex-1 p-3 space-y-3 overflow-y-auto">
        {tickets.map((ticket, index) => (
          <div
            key={ticket.id}
            className="animate-slide-up"
            style={{ animationDelay: `${index * 50}ms` }}
          >
            <TicketCard
              ticket={ticket}
              onClick={() => onTicketClick?.(ticket)}
              projectId={projectId}
              onTicketDeleted={onTicketDeleted}
              isReadOnly={isReadOnly}
            />
          </div>
        ))}

        {tickets.length === 0 && (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <p className="text-sm text-muted-foreground">Aucun ticket</p>
            <Button 
              variant="ghost" 
              size="sm" 
              className="mt-2 text-primary"
              onClick={onAddTicket}
            >
              <Plus className="w-4 h-4 mr-1" />
              Ajouter un ticket
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
