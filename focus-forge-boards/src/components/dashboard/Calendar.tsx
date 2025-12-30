import React, { useState } from 'react';
import { ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface CalendarEvent {
  date: number;
  title: string;
  color: 'primary' | 'secondary' | 'accent' | 'destructive';
}

interface CalendarProps {
  events?: CalendarEvent[];
}

export const Calendar: React.FC<CalendarProps> = ({ events = [] }) => {
  const [currentDate, setCurrentDate] = useState(new Date());

  const getDaysInMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth() + 1, 0).getDate();
  };

  const getFirstDayOfMonth = (date: Date) => {
    return new Date(date.getFullYear(), date.getMonth(), 1).getDay();
  };

  const previousMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() - 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(currentDate.getFullYear(), currentDate.getMonth() + 1));
  };

  const monthName = currentDate.toLocaleString('default', { month: 'long', year: 'numeric' });
  const daysInMonth = getDaysInMonth(currentDate);
  const firstDay = getFirstDayOfMonth(currentDate);
  const days = Array.from({ length: daysInMonth }, (_, i) => i + 1);
  const emptyDays = Array.from({ length: firstDay }, (_, i) => i);

  const getEventForDate = (date: number) => {
    return events.find(e => e.date === date);
  };

  const colorMap: Record<string, string> = {
    primary: 'bg-primary text-primary-foreground',
    secondary: 'bg-secondary text-secondary-foreground',
    accent: 'bg-accent text-accent-foreground',
    destructive: 'bg-destructive text-destructive-foreground',
  };

  return (
    <div className="calendar-wrapper">
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
            const event = getEventForDate(day);
            return (
              <div
                key={day}
                className={`calendar-day ${event ? 'has-event' : ''}`}
                title={event?.title}
              >
                <div className="calendar-day-number">{day}</div>
                {event && (
                  <div className={`calendar-event ${colorMap[event.color]}`}>
                    <span className="calendar-event-dot"></span>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      <style>{`
        .calendar-wrapper {
          width: 100%;
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
        }

        .calendar-month {
          font-size: 1.125rem;
          font-weight: 600;
          color: hsl(var(--card-foreground));
          min-width: 150px;
          text-align: center;
        }

        .calendar-nav-btn {
          padding: 0.375rem;
          height: auto;
          width: auto;
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
          font-weight: 600;
          color: hsl(var(--muted-foreground));
          text-transform: uppercase;
          padding: 0.5rem;
        }

        .calendar-days {
          display: grid;
          grid-template-columns: repeat(7, 1fr);
          gap: 0.5rem;
        }

        .calendar-day {
          aspect-ratio: 1;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: flex-start;
          padding: 0.5rem;
          border-radius: calc(var(--radius) - 4px);
          background: hsl(var(--background));
          border: 1px solid transparent;
          cursor: pointer;
          transition: all 0.2s ease;
          position: relative;
        }

        .calendar-day:not(.empty):hover {
          background: hsl(var(--muted));
          border-color: hsl(var(--border));
        }

        .calendar-day.empty {
          cursor: default;
          background: transparent;
          border: none;
        }

        .calendar-day-number {
          font-size: 0.875rem;
          font-weight: 500;
          color: hsl(var(--foreground));
        }

        .calendar-event {
          width: 100%;
          padding: 0.25rem 0.375rem;
          border-radius: 2px;
          font-size: 0.625rem;
          margin-top: 0.25rem;
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 0.25rem;
        }

        .calendar-event-dot {
          width: 3px;
          height: 3px;
          border-radius: 50%;
          background: currentColor;
        }

        @media (max-width: 768px) {
          .calendar-container {
            padding: 1rem;
          }

          .calendar-weekday {
            font-size: 0.65rem;
          }

          .calendar-day-number {
            font-size: 0.75rem;
          }

          .calendar-event {
            font-size: 0.5rem;
          }
        }
      `}</style>
    </div>
  );
};
