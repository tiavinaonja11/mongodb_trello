import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export interface ProjectInvitation {
  _id: string;
  projectId: {
    _id: string;
    name: string;
    description?: string;
  };
  email: string;
  firstName: string;
  lastName: string;
  role: 'member' | 'admin';
  token: string;
  status: 'pending' | 'accepted' | 'rejected' | 'expired';
  invitedByUserId: {
    fullName: string;
    email: string;
  };
  createdAt: string;
  expiresAt: string;
}

export const useProjectInvitations = () => {
  const { token } = useAuth();
  const [invitations, setInvitations] = useState<ProjectInvitation[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchInvitations = async () => {
    if (!token) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const response = await fetch('/api/projects/invitations/pending', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project invitations');
      }

      const data = await response.json();
      setInvitations(data.invitations || []);
      setError(null);
    } catch (err) {
      console.error('Error fetching project invitations:', err);
      setError(err instanceof Error ? err.message : 'Failed to fetch project invitations');
      setInvitations([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchInvitations();
  }, [token]);

  const acceptInvitation = async (invitationToken: string, email: string) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await fetch(`/api/projects/invitations/${invitationToken}/accept`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || 'Failed to accept project invitation');
      }

      // Remove from list after accepting
      setInvitations(invitations.filter(inv => inv.token !== invitationToken));
      return true;
    } catch (err) {
      console.error('Error accepting project invitation:', err);
      throw err;
    }
  };

  const rejectInvitation = async (invitationId: string) => {
    if (!token) throw new Error('Not authenticated');

    try {
      const response = await fetch(`/api/projects/invitations/${invitationId}/reject`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to reject project invitation');
      }

      // Remove from list after rejecting
      setInvitations(invitations.filter(inv => inv._id !== invitationId));
      return true;
    } catch (err) {
      console.error('Error rejecting project invitation:', err);
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
