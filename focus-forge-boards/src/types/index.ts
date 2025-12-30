export type TicketStatus = 'todo' | 'in_progress' | 'review' | 'done';
export type ProjectStatus = 'active' | 'inactive' | 'archived';
export type UserRole = 'owner' | 'admin' | 'member';

export interface User {
  _id?: string;
  id?: string;
  fullName: string;
  email: string;
  firstName?: string;
  lastName?: string;
  phone?: string;
  avatar?: string;
}

export interface PopulatedUser extends User {
  _id: string;
  fullName: string;
  email: string;
}

export interface ProjectMemberData {
  userId: PopulatedUser;
  role: UserRole;
}

export interface Project {
  id: string;
  _id?: string;
  name: string;
  description: string;
  status: ProjectStatus;
  ownerId: PopulatedUser | string;
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  members?: ProjectMemberData[];
}

export interface ProjectMember {
  userId: string;
  projectId: string;
  role: UserRole;
  user: User;
}

export interface Ticket {
  _id?: string;
  id: string;
  projectId: string;
  title: string;
  description: string;
  status: TicketStatus;
  priority?: 'low' | 'medium' | 'high' | 'urgent';
  estimatedDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  creatorId: PopulatedUser | string;
  assignees?: PopulatedUser[];
  commentsCount?: number;
}

export interface Comment {
  id: string;
  ticketId: string;
  content: string;
  authorId: string;
  author: User;
  createdAt: Date;
  updatedAt: Date;
}

export const STATUS_LABELS: Record<TicketStatus, string> = {
  todo: 'À faire',
  in_progress: 'En cours',
  review: 'En validation',
  done: 'Terminé',
};

export const PROJECT_STATUS_LABELS: Record<ProjectStatus, string> = {
  active: 'Actif',
  inactive: 'Inactif',
  archived: 'Archivé',
};
