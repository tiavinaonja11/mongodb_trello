import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Ticket } from '@/types';

const API_URL = '/api/tickets';

export const useTickets = (projectId: string) => {
  const { token } = useAuth();
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  // Fetch tickets for a project
  const fetchTickets = async () => {
    if (!token || !projectId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/project/${projectId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch tickets');
      }

      const ticketsWithId = (data.tickets || []).map((t: any) => ({
        ...t,
        id: t.id || t._id,
      }));
      setTickets(ticketsWithId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch tickets';
      setError(message);
      console.error('Error fetching tickets:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // Create new ticket
  const createTicket = async (
    title: string,
    description: string,
    status: string,
    priority: string,
    teamId: string,
    assignees?: string[],
    estimatedDate?: string
  ) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/project/${projectId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          title,
          description,
          status,
          priority,
          type: '',
          teamId: teamId || null,
          assignees: assignees && assignees.length > 0 ? assignees : [],
          estimatedDate: estimatedDate || null,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create ticket');
      }

      // Add new ticket to list
      const ticketWithId = {
        ...data.ticket,
        id: data.ticket.id || data.ticket._id,
      };
      setTickets([ticketWithId, ...tickets]);
      return data.ticket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create ticket';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Update ticket
  const updateTicket = async (ticketId: string, updates: Partial<Ticket>) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/${ticketId}`, {
        method: 'PUT',
        headers,
        body: JSON.stringify(updates),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to update ticket');
      }

      // Update in list
      const ticketWithId = {
        ...data.ticket,
        id: data.ticket.id || data.ticket._id,
      };
      setTickets(tickets.map(t => t.id === ticketId ? ticketWithId : t));
      return data.ticket;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to update ticket';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Delete ticket
  const deleteTicket = async (ticketId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch(`${API_URL}/${ticketId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete ticket');
      }

      // Remove from list
      setTickets(tickets.filter(t => t.id !== ticketId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete ticket';
      setError(message);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch tickets on mount
  useEffect(() => {
    fetchTickets();
  }, [token, projectId]);

  return {
    tickets,
    isLoading,
    error,
    fetchTickets,
    createTicket,
    updateTicket,
    deleteTicket,
  };
};
