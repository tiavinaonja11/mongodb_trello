import { useState, useEffect } from 'react';

interface TeamMember {
  _id?: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: string;
  projectCount: number;
  addedAt?: string;
}

interface Team {
  _id: string;
  name: string;
  description?: string;
  members: TeamMember[];
  createdAt: string;
  updatedAt: string;
}

export const useTeams = () => {
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchTeams = async () => {
      try {
        setLoading(true);
        const response = await fetch('/api/teams');
        
        if (!response.ok) {
          throw new Error('Failed to fetch teams');
        }

        const data = await response.json();
        setTeams(data.data || []);
        setError(null);
      } catch (err) {
        console.error('Error fetching teams:', err);
        setError(err instanceof Error ? err.message : 'Failed to fetch teams');
        setTeams([]);
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, []);

  const addMember = async (teamId: string, member: Omit<TeamMember, '_id' | 'addedAt'>) => {
    try {
      const response = await fetch(`/api/teams/${teamId}/members`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify(member),
      });

      if (!response.ok) {
        throw new Error('Failed to add member');
      }

      const data = await response.json();
      setTeams(teams.map(t => t._id === teamId ? data.data : t));
      return data.data;
    } catch (err) {
      console.error('Error adding member:', err);
      throw err;
    }
  };

  const createTeam = async (name: string, description?: string) => {
    try {
      const response = await fetch('/api/teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
        body: JSON.stringify({ name, description }),
      });

      if (!response.ok) {
        throw new Error('Failed to create team');
      }

      const data = await response.json();
      setTeams([...teams, data.data]);
      return data.data;
    } catch (err) {
      console.error('Error creating team:', err);
      throw err;
    }
  };

  const getProjectParticipants = async () => {
    try {
      const response = await fetch('/api/teams/participants', {
        headers: {
          'Authorization': `Bearer ${localStorage.getItem('authToken')}`,
        },
      });

      if (!response.ok) {
        throw new Error('Failed to fetch project participants');
      }

      const data = await response.json();
      return Array.isArray(data.data) ? data.data : [];
    } catch (err) {
      console.error('Error fetching project participants:', err);
      throw err;
    }
  };

  return {
    teams,
    loading,
    error,
    addMember,
    createTeam,
    getProjectParticipants,
  };
};
