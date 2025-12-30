import { useState } from 'react';
import { Ticket, TicketStatus } from '@/types';
import { KanbanColumn } from './KanbanColumn';
import { TicketDetailModal } from '@/components/tickets/TicketDetailModal';

interface KanbanBoardProps {
  tickets: Ticket[];
  projectId?: string;
  onAddTicket?: () => void;
  onTicketUpdated?: () => void;
  isReadOnly?: boolean;
}

const columns: TicketStatus[] = ['todo', 'in_progress', 'review', 'done'];

export function KanbanBoard({ tickets, projectId, onAddTicket, onTicketUpdated, isReadOnly = false }: KanbanBoardProps) {
  const [selectedTicket, setSelectedTicket] = useState<Ticket | null>(null);

  const getTicketsByStatus = (status: TicketStatus) => {
    return tickets.filter((ticket) => ticket.status === status);
  };

  return (
    <>
      <div className="flex gap-4 overflow-x-auto pb-4 h-[calc(100vh-220px)]">
        {columns.map((status) => (
          <KanbanColumn
            key={status}
            status={status}
            tickets={getTicketsByStatus(status)}
            onTicketClick={setSelectedTicket}
            onAddTicket={onAddTicket}
            isReadOnly={isReadOnly}
            projectId={projectId}
            onTicketDeleted={onTicketUpdated}
          />
        ))}
      </div>

      <TicketDetailModal
        ticket={selectedTicket}
        open={!!selectedTicket}
        onClose={() => setSelectedTicket(null)}
        projectId={projectId}
        isReadOnly={isReadOnly}
        onTicketUpdated={() => {
          setSelectedTicket(null);
          onTicketUpdated?.();
        }}
      />
    </>
  );
}
