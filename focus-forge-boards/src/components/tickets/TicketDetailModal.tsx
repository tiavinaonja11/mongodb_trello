import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import { Calendar, Users, MessageSquare, Edit2, Trash2, X } from 'lucide-react';
import { Ticket, STATUS_LABELS, TicketStatus } from '@/types';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useComments } from '@/hooks/use-comments';
import { useTickets } from '@/hooks/use-tickets';
import { toast } from 'sonner';

interface TicketDetailModalProps {
  ticket: Ticket | null;
  open: boolean;
  onClose: () => void;
  projectId?: string;
  isReadOnly?: boolean;
  onTicketUpdated?: () => void;
}

const statusColors: Record<TicketStatus, string> = {
  todo: 'bg-status-todo text-primary-foreground',
  in_progress: 'bg-status-progress text-primary-foreground',
  review: 'bg-status-review text-primary-foreground',
  done: 'bg-status-done text-primary-foreground',
};

export function TicketDetailModal({ ticket, open, onClose, projectId, isReadOnly = false, onTicketUpdated }: TicketDetailModalProps) {
  const [newComment, setNewComment] = useState('');
  const [isEditingTicket, setIsEditingTicket] = useState(false);
  const [editedTitle, setEditedTitle] = useState('');
  const [editedDescription, setEditedDescription] = useState('');
  const [editedStatus, setEditedStatus] = useState<TicketStatus>('todo');
  const [isCommentLoading, setIsCommentLoading] = useState(false);
  const [isDeletingTicket, setIsDeletingTicket] = useState(false);
  const { user } = useAuth();
  const { comments, createComment, deleteComment: deleteCommentAPI } = useComments(ticket?.id || '');
  const { deleteTicket, updateTicket } = useTickets(projectId || '');

  if (!ticket) return null;

  // Compare creatorId - handle both object and string formats
  const creatorId = typeof ticket.creatorId === 'object' ? (ticket.creatorId._id || ticket.creatorId.id) : ticket.creatorId;
  const isCreator = creatorId === user?.id;

  const getInitials = (name: string) => {
    if (!name) return '?';
    const parts = name.split(' ');
    return parts.map(p => p[0]).join('').toUpperCase().slice(0, 2);
  };

  const handleStartEdit = () => {
    setEditedTitle(ticket.title);
    setEditedDescription(ticket.description);
    setEditedStatus(ticket.status);
    setIsEditingTicket(true);
  };

  const handleSaveEdit = async () => {
    if (!editedTitle.trim()) {
      toast.error('Le titre ne peut pas être vide');
      return;
    }

    try {
      await updateTicket(ticket.id, {
        title: editedTitle,
        description: editedDescription,
        status: editedStatus,
      });
      toast.success('Ticket mis à jour avec succès');
      setIsEditingTicket(false);
      if (onTicketUpdated) {
        onTicketUpdated();
      }
    } catch (error) {
      toast.error('Erreur lors de la mise à jour');
    }
  };

  const handleDeleteTicket = async () => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce ticket ?')) {
      return;
    }

    setIsDeletingTicket(true);
    try {
      await deleteTicket(ticket.id);
      toast.success('Ticket supprimé avec succès');
      onClose();
      if (onTicketUpdated) {
        onTicketUpdated();
      }
    } catch (error) {
      toast.error('Erreur lors de la suppression');
    } finally {
      setIsDeletingTicket(false);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim()) {
      toast.error('Le commentaire ne peut pas être vide');
      return;
    }

    setIsCommentLoading(true);
    try {
      await createComment(newComment);
      setNewComment('');
      toast.success('Commentaire ajouté');
    } catch (error) {
      toast.error('Erreur lors de l\'ajout du commentaire');
    } finally {
      setIsCommentLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-hidden flex flex-col glass-card">
        <DialogDescription className="sr-only">
          Détails du ticket {ticket.title}
        </DialogDescription>
        <DialogHeader className="border-b border-border pb-4">
          <div className="flex items-start justify-between gap-4">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs text-muted-foreground">#{ticket.id}</span>
                <Badge className={cn("text-xs", statusColors[ticket.status])}>
                  {STATUS_LABELS[ticket.status]}
                </Badge>
              </div>
              {isEditingTicket ? (
                <input
                  type="text"
                  value={editedTitle}
                  onChange={(e) => setEditedTitle(e.target.value)}
                  className="text-xl font-semibold text-foreground bg-secondary/50 border-2 border-primary rounded-lg px-3 py-2 w-full mb-2 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
                  placeholder="Titre du ticket"
                />
              ) : (
                <DialogTitle className="text-xl font-semibold text-foreground">
                  {ticket.title}
                </DialogTitle>
              )}
            </div>
            {!isEditingTicket && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleStartEdit}
                  disabled={isReadOnly}
                  title={isReadOnly ? 'Impossible de modifier en lecture seule' : ''}
                >
                  <Edit2 className="w-4 h-4" />
                </Button>
                {isCreator && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="text-destructive hover:text-destructive"
                    onClick={handleDeleteTicket}
                    disabled={isDeletingTicket || isReadOnly}
                    title={isReadOnly ? 'Impossible de supprimer en lecture seule' : ''}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                )}
              </div>
            )}
            {isEditingTicket && (
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setIsEditingTicket(false)}>
                  Annuler
                </Button>
                <Button variant="gradient" size="sm" onClick={handleSaveEdit}>
                  Enregistrer
                </Button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto py-4 space-y-6">
          {/* Description */}
          <div className="space-y-2">
            <h4 className="text-sm font-semibold text-foreground flex items-center gap-2">
              Description
              {isEditingTicket && <span className="text-xs text-primary">(Édition)</span>}
            </h4>
            {isEditingTicket ? (
              <Textarea
                value={editedDescription}
                onChange={(e) => setEditedDescription(e.target.value)}
                rows={4}
                placeholder="Décrivez le ticket en détail..."
                className="bg-secondary/50 border-2 border-primary rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none"
              />
            ) : (
              <p className="text-foreground text-sm leading-relaxed bg-secondary/30 rounded-lg p-3">
                {ticket.description || <span className="text-muted-foreground italic">Aucune description</span>}
              </p>
            )}
          </div>

          {/* Status Edit */}
          {isEditingTicket && (
            <div className="space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Statut</h4>
              <select
                value={editedStatus}
                onChange={(e) => setEditedStatus(e.target.value as TicketStatus)}
                className="w-full px-3 py-2 bg-secondary/50 border-2 border-primary rounded-lg text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
              >
                <option value="todo">À faire</option>
                <option value="in_progress">En cours</option>
                <option value="review">En validation</option>
                <option value="done">Terminé</option>
              </select>
            </div>
          )}

          {/* Meta info */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Date d'estimation
              </h4>
              {ticket.estimatedDate ? (
                <p className="text-foreground">
                  {format(new Date(ticket.estimatedDate), 'd MMMM yyyy', { locale: fr })}
                </p>
              ) : (
                <p className="text-muted-foreground">Aucune date</p>
              )}
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                <Users className="w-4 h-4" />
                Assignés
              </h4>
              {isEditingTicket ? (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground">
                    Fonction d'assignation en édition non disponible pour le moment
                  </p>
                </div>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {(() => {
                    // Safety check for assignees
                    const hasAssignees = ticket.assignees &&
                      Array.isArray(ticket.assignees) &&
                      ticket.assignees.length > 0 &&
                      ticket.assignees.some(a => a); // Ensure at least one valid assignee

                    if (!hasAssignees) {
                      return <span className="text-muted-foreground text-sm">Non assigné</span>;
                    }

                    return ticket.assignees.map((assignee, idx) => {
                      const fullName = assignee?.fullName || assignee?.name || assignee?.email || 'Unknown';
                      const assigneeId = assignee?._id || assignee?.id || idx.toString();
                      const projectCount = assignee?.projectCount || 0;
                      return (
                        <div
                          key={assigneeId}
                          className="flex items-center gap-2 bg-secondary px-3 py-2 rounded-full"
                        >
                          <div className="w-5 h-5 rounded-full bg-primary/20 flex items-center justify-center">
                            <span className="text-[10px] font-medium text-primary">
                              {getInitials(fullName)}
                            </span>
                          </div>
                          <div className="flex items-center gap-1">
                            <span className="text-sm font-medium">{fullName}</span>
                            <span className="text-xs text-muted-foreground bg-background/50 px-1.5 py-0.5 rounded">
                              {projectCount} projet{projectCount !== 1 ? 's' : ''}
                            </span>
                          </div>
                        </div>
                      );
                    });
                  })()}
                </div>
              )}
            </div>
          </div>

          {/* Comments */}
          {!isEditingTicket && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-4">
                <MessageSquare className="w-4 h-4" />
                Commentaires ({comments.length})
              </h4>

              <div className="space-y-4">
                {comments.length > 0 ? (
                  comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3 animate-fade-in">
                      <div className="w-8 h-8 rounded-full bg-secondary flex items-center justify-center shrink-0">
                        <span className="text-xs font-medium">
                          {getInitials(comment.author?.fullName || comment.author?.email || 'Unknown')}
                        </span>
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-sm font-medium">
                            {comment.author?.fullName || comment.author?.email || 'Unknown'}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {format(new Date(comment.createdAt), 'd MMM à HH:mm', { locale: fr })}
                          </span>
                          {user?.id === comment.author?.id && !isReadOnly && (
                            <button
                              onClick={() => deleteCommentAPI(comment.id)}
                              className="ml-auto text-xs text-destructive hover:text-destructive/80"
                            >
                              Supprimer
                            </button>
                          )}
                        </div>
                        <p className="text-sm text-foreground">{comment.content}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    Aucun commentaire pour le moment
                  </p>
                )}
              </div>

              {/* Add comment */}
              {isReadOnly ? (
                <div className="mt-4 pt-4 border-t border-border p-3 bg-muted/50 rounded-lg text-sm text-muted-foreground">
                  Les commentaires sont désactivés en lecture seule
                </div>
              ) : user ? (
                <div className="mt-4 pt-4 border-t border-border">
                  <div className="flex gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center shrink-0">
                      <span className="text-xs font-medium text-primary">
                        {getInitials(user.fullName || user.email)}
                      </span>
                    </div>
                    <div className="flex-1 space-y-2">
                      <Textarea
                        placeholder="Ajouter un commentaire..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px] resize-none"
                      />
                      <div className="flex justify-end">
                        <Button
                          size="sm"
                          disabled={!newComment.trim() || isCommentLoading}
                          onClick={handleAddComment}
                        >
                          {isCommentLoading ? 'Envoi...' : 'Envoyer'}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ) : null}
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
