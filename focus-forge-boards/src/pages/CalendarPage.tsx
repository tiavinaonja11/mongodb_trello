import React, { useState, useMemo, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Plus, Calendar as CalendarIcon, CheckCircle2, Clock, AlertCircle, File } from 'lucide-react';
import { MainLayout } from '@/components/layout/MainLayout';
import { Button } from '@/components/ui/button';
import { useProjects } from '@/hooks/use-projects';
import { useAuth } from '@/contexts/AuthContext';
import { Project, ProjectStatus, Ticket, TicketStatus } from '@/types';

interface CalendarEvent {
  id: string;
  date: number;
  title: string;
  description?: string;
  time?: string;
  color: 'primary' | 'secondary' | 'accent' | 'destructive';
  assigned?: string;
  project?: Project;
  ticket?: Ticket;
  type: 'project' | 'ticket';
}

const CalendarPage = () => {
  const { projects, isLoading, error } = useProjects();
  const { token } = useAuth();
  const [currentDate, setCurrentDate] = useState(new Date());
  const [selectedDate, setSelectedDate] = useState<number | null>(null);
  const [allTickets, setAllTickets] = useState<Ticket[]>([]);
  const [ticketsLoading, setTicketsLoading] = useState(false);

  const statusColorMap: Record<ProjectStatus, 'primary' | 'secondary' | 'accent' | 'destructive'> = {
    active: 'primary',
    inactive: 'secondary',
    archived: 'accent',
  };

  const ticketStatusColorMap: Record<TicketStatus, 'primary' | 'secondary' | 'accent' | 'destructive'> = {
    todo: 'secondary',
    in_progress: 'primary',
    review: 'accent',
    done: 'destructive',
  };

  // Fetch all tickets from all projects
  useEffect(() => {
    const fetchAllTickets = async () => {
      if (!projects.length || !token) return;

      setTicketsLoading(true);
      try {
        const tickets: Ticket[] = [];
        for (const project of projects) {
          try {
            const response = await fetch(`/api/tickets/project/${project.id}`, {
              headers: {
                'Authorization': `Bearer ${token}`,
                'Content-Type': 'application/json',
              },
            });
            if (response.ok) {
              const data = await response.json();
              tickets.push(...(data.tickets || []));
            }
          } catch (err) {
            console.error(`Error fetching tickets for project ${project.id}:`, err);
          }
        }
        setAllTickets(tickets);
      } finally {
        setTicketsLoading(false);
      }
    };

    fetchAllTickets();
  }, [projects, token]);

  const events = useMemo(() => {
    const projectEvents = projects
      .filter(p => p.dueDate)
      .map(project => {
        const dueDate = new Date(project.dueDate!);
        return {
          id: project.id,
          date: dueDate.getDate(),
          title: project.name,
          description: project.description,
          color: statusColorMap[project.status],
          assigned: undefined,
          project,
          type: 'project' as const,
        };
      });

    const ticketEvents = allTickets
      .filter(t => t.estimatedDate)
      .map((ticket, idx) => {
        const estimatedDate = new Date(ticket.estimatedDate!);
        return {
          id: `ticket-${ticket.id || `temp-${idx}`}`,
          date: estimatedDate.getDate(),
          title: ticket.title,
          description: ticket.description,
          color: ticketStatusColorMap[ticket.status],
          assigned: undefined,
          ticket,
          type: 'ticket' as const,
        };
      });

    return [...projectEvents, ...ticketEvents];
  }, [projects, allTickets]);

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const isToday = (day: number) => {
    const today = new Date();
    return day === today.getDate() &&
           currentDate.getMonth() === today.getMonth() &&
           currentDate.getFullYear() === today.getFullYear();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
    setSelectedDate(null);
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
    setSelectedDate(null);
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getEventsForDate = (date: number) => {
    return events.filter(e => {
      const dateObj = e.project?.dueDate ? new Date(e.project.dueDate) :
                      e.ticket?.estimatedDate ? new Date(e.ticket.estimatedDate) : null;

      if (!dateObj) return false;

      return dateObj.getDate() === date &&
             dateObj.getMonth() === currentDate.getMonth() &&
             dateObj.getFullYear() === currentDate.getFullYear();
    });
  };

  const selectedDateEvents = selectedDate ? getEventsForDate(selectedDate) : [];

  const colorMap: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  const colorBorder: Record<string, string> = {
    primary: 'border-primary',
    secondary: 'border-secondary',
    accent: 'border-accent',
    destructive: 'border-destructive',
  };

  if (isLoading || ticketsLoading) {
    return (
      <MainLayout>
        <div className="space-y-6 animate-fade-in">
          <div>
            <h1 className="text-3xl font-bold text-foreground mb-2">Calendrier</h1>
            <p className="text-muted-foreground">Chargement des projets et des tickets...</p>
          </div>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="space-y-6 animate-fade-in">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold text-foreground mb-2">Calendrier</h1>
          <p className="text-muted-foreground">Visualisez vos projets et tickets par date limite</p>
          {error && <p className="text-destructive text-sm mt-2">{error}</p>}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Calendar */}
          <div className="lg:col-span-2">
            <div className="calendar-container">
              {/* Header */}
              <div className="calendar-header">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={previousMonth}
                  className="calendar-nav-btn"
                >
                  <ChevronLeft className="w-4 h-4" />
                </Button>
                <h2 className="calendar-month">{monthName}</h2>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={nextMonth}
                  className="calendar-nav-btn"
                >
                  <ChevronRight className="w-4 h-4" />
                </Button>
              </div>

              {/* Day Names */}
              <div className="calendar-weekdays">
                {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(day => (
                  <div key={day} className="calendar-weekday">
                    {day}
                  </div>
                ))}
              </div>

              {/* Days */}
              <div className="calendar-days">
                {emptyDays.map((_, i) => (
                  <div key={`empty-${i}`} className="calendar-day empty"></div>
                ))}
                {days.map(day => {
                  const dayEvents = getEventsForDate(day);
                  const isSelected = selectedDate === day;
                  const todayFlag = isToday(day);

                  return (
                    <div
                      key={day}
                      onClick={() => setSelectedDate(isSelected ? null : day)}
                      className={`calendar-day-full ${isSelected ? 'selected' : ''} ${todayFlag ? 'today' : ''} ${dayEvents.length > 0 ? 'has-events' : ''}`}
                    >
                      <div className="calendar-day-number">
                        {day}
                        {todayFlag && <span className="today-indicator"></span>}
                      </div>
                      <div className="calendar-day-events">
                        {dayEvents.slice(0, 2).map((event, idx) => (
                          <div
                            key={idx}
                            className={`calendar-event-dot ${colorMap[event.color].split(' ')[0]}`}
                            title={event.title}
                          ></div>
                        ))}
                        {dayEvents.length > 2 && (
                          <div className="calendar-event-more">+{dayEvents.length - 2}</div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Events Sidebar */}
          <div className="lg:col-span-1">
            <div className="event-sidebar">
              <div className="event-sidebar-header">
                <h3 className="event-sidebar-title">
                  {selectedDate ? `${selectedDate} ${monthName.split(' ')[0]}` : 'Sélectionnez une date'}
                </h3>
                {selectedDate && (
                  <Button variant="ghost" size="sm" className="event-add-btn">
                    <Plus className="w-4 h-4" />
                  </Button>
                )}
              </div>

              <div className="event-list">
                {selectedDateEvents.length > 0 ? (
                  selectedDateEvents.map((event) => {
                    const getEventIcon = () => {
                      if (event.type === 'project') return <File className="w-4 h-4" />;
                      if (event.ticket?.status === 'done') return <CheckCircle2 className="w-4 h-4" />;
                      if (event.ticket?.status === 'in_progress') return <Clock className="w-4 h-4" />;
                      if (event.ticket?.status === 'review') return <AlertCircle className="w-4 h-4" />;
                      return <CalendarIcon className="w-4 h-4" />;
                    };

                    return (
                      <div
                        key={event.id}
                        className={`event-item border-l-4 ${colorBorder[event.color]}`}
                      >
                        <div className="event-item-header">
                          <div className="event-item-icon">
                            {getEventIcon()}
                          </div>
                          <div className="flex-1">
                            <h4 className="event-item-title">{event.title}</h4>
                            {event.type === 'ticket' && (
                              <p className="text-xs text-muted-foreground">Ticket • {event.ticket?.priority || 'Normal'}</p>
                            )}
                            {event.type === 'project' && (
                              <p className="text-xs text-muted-foreground">Projet • {event.project?.members?.length || 0} membres</p>
                            )}
                          </div>
                        </div>
                        {event.project && (
                          <span className={`event-badge ${colorMap[event.color]}`}>
                            {event.project.status === 'active' ? 'Actif' : event.project.status === 'inactive' ? 'Inactif' : 'Archivé'}
                          </span>
                        )}
                        {event.ticket && (
                          <span className={`event-badge ${colorMap[event.color]}`}>
                            {event.ticket.status === 'todo' ? 'À faire' : event.ticket.status === 'in_progress' ? 'En cours' : event.ticket.status === 'review' ? 'En validation' : 'Terminé'}
                          </span>
                        )}
                        {event.description && (
                          <p className="event-item-description">{event.description}</p>
                        )}
                      </div>
                    );
                  })
                ) : selectedDate ? (
                  <div className="event-empty">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p>Aucun événement ce jour</p>
                  </div>
                ) : (
                  <div className="event-empty">
                    <CalendarIcon className="w-8 h-8 text-muted-foreground/50 mx-auto mb-2" />
                    <p>Cliquez sur une date pour voir les événements</p>
                  </div>
                )}
              </div>

              {/* All Upcoming Events */}
              {selectedDate === null && (
                <div className="event-upcoming">
                  <h4 className="event-upcoming-title">À venir</h4>
                  <div className="event-upcoming-list">
                    {events.filter(event => {
                      const eventDate = event.project?.dueDate ? new Date(event.project.dueDate) :
                                       event.ticket?.estimatedDate ? new Date(event.ticket.estimatedDate) : null;
                      return eventDate && eventDate >= currentDate;
                    })
                    .sort((a, b) => {
                      const dateA = a.project?.dueDate ? new Date(a.project.dueDate) :
                                   a.ticket?.estimatedDate ? new Date(a.ticket.estimatedDate) : new Date();
                      const dateB = b.project?.dueDate ? new Date(b.project.dueDate) :
                                   b.ticket?.estimatedDate ? new Date(b.ticket.estimatedDate) : new Date();
                      return dateA.getTime() - dateB.getTime();
                    })
                    .slice(0, 10)
                    .map((event) => {
                      const eventDate = event.project?.dueDate ? new Date(event.project.dueDate) :
                                       event.ticket?.estimatedDate ? new Date(event.ticket.estimatedDate) : null;
                      return (
                        <div
                          key={event.id}
                          className={`event-upcoming-item border-l-4 ${colorBorder[event.color]}`}
                        >
                          <div className="event-upcoming-date">
                            {eventDate?.getDate()}
                          </div>
                          <div className="event-upcoming-content">
                            <p className="event-upcoming-name">{event.title}</p>
                            <p className="event-upcoming-time">
                              {event.type === 'project' ? (
                                event.project?.status === 'active' ? 'Projet • Actif' : event.project?.status === 'inactive' ? 'Projet • Inactif' : 'Projet • Archivé'
                              ) : (
                                `Ticket • ${event.ticket?.status === 'todo' ? 'À faire' : event.ticket?.status === 'in_progress' ? 'En cours' : event.ticket?.status === 'review' ? 'En validation' : 'Terminé'}`
                              )}
                            </p>
                          </div>
                        </div>
                      );
                    })}
                    {events.filter(event => {
                      const eventDate = event.project?.dueDate ? new Date(event.project.dueDate) :
                                       event.ticket?.estimatedDate ? new Date(event.ticket.estimatedDate) : null;
                      return eventDate && eventDate >= currentDate;
                    }).length === 0 && (
                      <div className="event-empty">
                        <p className="text-xs">Aucun événement à venir</p>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <style>{`
        @keyframes pulse-ring {
          0% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0.7);
          }
          70% {
            box-shadow: 0 0 0 6px rgba(59, 130, 246, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(59, 130, 246, 0);
          }
        }

        @keyframes slide-in {
          from {
            opacity: 0;
            transform: translateY(4px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .calendar-container {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
        }

        .calendar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          margin-bottom: 1.5rem;
          gap: 1rem;
        }

        .calendar-month {
          font-size: 1.25rem;
          font-weight: 700;
          color: hsl(var(--card-foreground));
          min-width: 180px;
          text-align: center;
        }

        .calendar-nav-btn {
          padding: 0.375rem;
          height: auto;
          width: auto;
          transition: all 0.2s ease;
        }

        .calendar-nav-btn:hover {
          background: hsl(var(--muted));
        }

        .calendar-weekdays {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
          margin-bottom: 1rem;
        }

        .calendar-weekday {
          text-align: center;
          font-size: 0.75rem;
          font-weight: 700;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          padding: 0.75rem 0.5rem;
          letter-spacing: 0.05em;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-day-full {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0.75rem;
          border-radius: calc(var(--radius) - 4px);
          background: hsl(var(--background));
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.3s cubic-bezier(0.34, 1.56, 0.64, 1);
          position: relative;
          animation: slide-in 0.3s ease-out;
        }

        .calendar-day-full:hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
          transform: translateY(-2px);
          box-shadow: 0 4px 8px rgba(0, 0, 0, 0.1);
        }

        .calendar-day-full.selected {
          background: hsl(var(--primary));
          color: hsl(var(--primary-foreground));
          border-color: hsl(var(--primary));
          box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
        }

        .calendar-day-full.selected .calendar-day-number {
          color: hsl(var(--primary-foreground));
          font-weight: 700;
        }

        .calendar-day-full.today {
          background: hsl(var(--muted));
          border-color: hsl(var(--primary));
        }

        .calendar-day-full.today:not(.selected) {
          border-width: 2px;
        }

        .calendar-day-full.empty {
          cursor: default;
          background: transparent;
          border: none;
          animation: none;
        }

        .calendar-day-full.empty:hover {
          background: transparent;
          border: none;
          transform: none;
          box-shadow: none;
        }

        .today-indicator {
          display: inline-block;
          width: 6px;
          height: 6px;
          background: hsl(var(--primary));
          border-radius: 50%;
          margin-left: 2px;
          animation: pulse-ring 2s infinite;
        }

        .calendar-day-full.selected .today-indicator {
          animation: none;
        }

        .calendar-day-number {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          display: flex;
          align-items: center;
          gap: 2px;
        }

        .calendar-day-events {
          display: flex;
          gap: 2px;
          margin-top: 0.25rem;
          flex-wrap: wrap;
          justify-content: center;
          width: 100%;
        }

        .calendar-event-dot {
          width: 5px;
          height: 5px;
          border-radius: 50%;
          transition: all 0.2s ease;
        }

        .calendar-event-dot.bg-primary {
          background: hsl(var(--primary));
        }

        .calendar-event-dot.bg-secondary {
          background: hsl(var(--secondary));
        }

        .calendar-event-dot.bg-accent {
          background: hsl(var(--accent));
        }

        .calendar-event-dot.bg-destructive {
          background: hsl(var(--destructive));
        }

        .calendar-event-more {
          font-size: 0.625rem;
          color: hsl(var(--muted-foreground));
          font-weight: 700;
        }

        .event-sidebar {
          background: hsl(var(--card));
          border: 1px solid hsl(var(--border));
          border-radius: calc(var(--radius) - 2px);
          padding: 1.5rem;
          box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
          height: fit-content;
          display: flex;
          flex-direction: column;
          gap: 1.5rem;
        }

        .event-sidebar-header {
          display: flex;
          align-items: center;
          justify-content: space-between;
          gap: 1rem;
        }

        .event-sidebar-title {
          font-size: 1.125rem;
          font-weight: 700;
          color: hsl(var(--card-foreground));
        }

        .event-add-btn {
          padding: 0.375rem;
          height: auto;
          width: auto;
          transition: all 0.2s ease;
        }

        .event-add-btn:hover {
          background: hsl(var(--muted));
        }

        .event-list {
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          max-height: 400px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }

        .event-list::-webkit-scrollbar {
          width: 6px;
        }

        .event-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .event-list::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 3px;
        }

        .event-item {
          background: hsl(var(--background));
          padding: 1rem;
          border-radius: calc(var(--radius) - 4px);
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
          border-left: 4px solid;
          transition: all 0.3s ease;
          animation: slide-in 0.3s ease-out;
        }

        .event-item:hover {
          box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
          transform: translateX(2px);
        }

        .event-item-header {
          display: flex;
          align-items: flex-start;
          gap: 0.75rem;
        }

        .event-item-icon {
          display: flex;
          align-items: center;
          justify-content: center;
          color: hsl(var(--muted-foreground));
          flex-shrink: 0;
          margin-top: 2px;
          transition: all 0.2s ease;
        }

        .event-item:hover .event-item-icon {
          color: hsl(var(--foreground));
        }

        .event-item-title {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          flex: 1;
          line-height: 1.4;
        }

        .event-badge {
          font-size: 0.625rem;
          font-weight: 700;
          padding: 0.35rem 0.65rem;
          border-radius: calc(var(--radius) - 6px);
          white-space: nowrap;
          text-transform: capitalize;
          letter-spacing: 0.02em;
        }

        .event-item-description {
          font-size: 0.75rem;
          color: hsl(var(--muted-foreground));
          margin: 0;
          line-height: 1.3;
        }

        .event-empty {
          text-align: center;
          padding: 2rem 1rem;
          color: hsl(var(--muted-foreground));
          font-size: 0.875rem;
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 0.5rem;
        }

        .event-upcoming {
          border-top: 1px solid hsl(var(--border));
          padding-top: 1rem;
          display: flex;
          flex-direction: column;
          gap: 0.75rem;
        }

        .event-upcoming-title {
          font-size: 0.75rem;
          font-weight: 700;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          letter-spacing: 0.05em;
        }

        .event-upcoming-list {
          display: flex;
          flex-direction: column;
          gap: 0.5rem;
          max-height: 300px;
          overflow-y: auto;
          scrollbar-width: thin;
          scrollbar-color: hsl(var(--border)) transparent;
        }

        .event-upcoming-list::-webkit-scrollbar {
          width: 6px;
        }

        .event-upcoming-list::-webkit-scrollbar-track {
          background: transparent;
        }

        .event-upcoming-list::-webkit-scrollbar-thumb {
          background: hsl(var(--border));
          border-radius: 3px;
        }

        .event-upcoming-item {
          display: flex;
          gap: 0.75rem;
          padding: 0.75rem;
          border-radius: calc(var(--radius) - 4px);
          background: hsl(var(--background));
          border-left: 3px solid;
          transition: all 0.3s ease;
          animation: slide-in 0.3s ease-out;
        }

        .event-upcoming-item:hover {
          box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
          transform: translateX(2px);
        }

        .event-upcoming-date {
          font-size: 0.75rem;
          font-weight: 700;
          color: hsl(var(--muted-foreground));
          min-width: 30px;
          display: flex;
          align-items: center;
          justify-content: center;
        }

        .event-upcoming-content {
          display: flex;
          flex-direction: column;
          gap: 0.25rem;
          flex: 1;
          min-width: 0;
        }

        .event-upcoming-name {
          font-size: 0.875rem;
          font-weight: 600;
          color: hsl(var(--foreground));
          margin: 0;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

        .event-upcoming-time {
          font-size: 0.625rem;
          color: hsl(var(--muted-foreground));
          margin: 0;
        }

        @media (max-width: 1024px) {
          .grid {
            grid-template-columns: 1fr;
          }

          .event-sidebar {
            height: auto;
          }
        }

        @media (max-width: 768px) {
          .calendar-container,
          .event-sidebar {
            padding: 1rem;
          }

          .calendar-month {
            font-size: 1rem;
          }

          .event-list,
          .event-upcoming-list {
            max-height: none;
          }

          .calendar-day-full {
            padding: 0.5rem;
          }

          .calendar-day-number {
            font-size: 0.75rem;
          }

          .event-item {
            padding: 0.75rem;
          }
        }
      `}</style>
    </MainLayout>
  );
};

export default CalendarPage;
