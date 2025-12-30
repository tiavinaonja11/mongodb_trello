import { useState, useEffect } from 'react';

interface TeamInvitation {
  _id: string;
  teamId: {
    _id: string;
    name: string;
    description?: string;
  };
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  status: 'pending' | 'accepted' | 'rejected';
  invitedByUserId: {
    fullName: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
}

export const useInvitations = () => {
  const [invitations, setInvitations] = useState<TeamInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/teams/invitations/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch invitations');
      }

      const data = await response.json();
      setInvitations(data.data || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, []);

  const acceptInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}/accept`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to accept invitation');
      }

      // Remove from list after accepting
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      return true;
    } catch (err) {
      console.error('Error accepting invitation:', err);
      throw err;
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    try {
      const response = await fetch(`/api/teams/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject invitation');
      }

      // Remove from list after rejecting
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      return true;
    } catch (err) {
      console.error('Error rejecting invitation:', err);
      throw err;
    }
  };

  const refreshInvitations = () => {
    fetchInvitations();
  };

  return {
    invitations,
    loading,
    error,
    acceptInvitation,
    rejectInvitation,
    refreshInvitations,
  };
};
