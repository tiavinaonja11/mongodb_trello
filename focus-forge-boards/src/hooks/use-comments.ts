import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  content: string;
  createdAt: Date;
  author?: {
    id: string;
    fullName: string;
    email: string;
  };
}

const API_URL = '/api/comments';

export const useComments = (ticketId: string) => {
  const { token } = useAuth();
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  };

  const fetchComments = async () => {
    if (!token || !ticketId) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      const response = await fetch(`${API_URL}/${ticketId}`, {
        method: 'GET',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to fetch comments');
      }

      const commentsWithId = (data.comments || []).map((c: any) => ({
        ...c,
        id: c.id || c._id,
      }));
      setComments(commentsWithId);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to fetch comments';
      setError(message);
      console.error('Error fetching comments:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const createComment = async (content: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setError(null);

    try {
      const response = await fetch(`${API_URL}/${ticketId}`, {
        method: 'POST',
        headers,
        body: JSON.stringify({ content }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to create comment');
      }

      const commentWithId = {
        ...data.comment,
        id: data.comment.id || data.comment._id,
      };
      setComments([commentWithId, ...comments]);
      return data.comment;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create comment';
      setError(message);
      throw err;
    }
  };

  const deleteComment = async (commentId: string) => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    setError(null);

    try {
      const response = await fetch(`${API_URL}/${commentId}`, {
        method: 'DELETE',
        headers,
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.message || 'Failed to delete comment');
      }

      setComments(comments.filter(c => c.id !== commentId));
      return true;
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to delete comment';
      setError(message);
      throw err;
    }
  };

  useEffect(() => {
    fetchComments();
  }, [token, ticketId]);

  return {
    comments,
    isLoading,
    error,
    fetchComments,
    createComment,
    deleteComment,
  };
};
