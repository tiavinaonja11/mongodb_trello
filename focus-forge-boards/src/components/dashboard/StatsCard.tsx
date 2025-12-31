import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';
import { TrendingUp, TrendingDown } from 'lucide-react';

interface StatsCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon: LucideIcon;
  trend?: {
    value: number;
    positive: boolean;
  };
  className?: string;
}

export function StatsCard({ title, value, description, icon: Icon, trend, className }: StatsCardProps) {
  return (
    <div className={cn(
      "stats-card relative overflow-hidden rounded-xl border border-border/50 bg-card p-6",
      "hover:border-primary/50 hover:shadow-lg hover:shadow-primary/10",
      "transition-all duration-300 group",
      className
    )}>
      {/* Gradient background effect */}
      <div className="absolute -right-8 -top-8 w-32 h-32 bg-gradient-to-br from-primary/10 to-accent/10 rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-300 blur-2xl"></div>

      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center group-hover:from-primary/30 group-hover:to-accent/30 transition-colors duration-300">
            <Icon className="w-6 h-6 text-primary" />
          </div>
          {trend && (
            <div className={cn(
              "flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors duration-300",
              trend.positive
                ? "bg-status-done/20 text-status-done group-hover:bg-status-done/30"
                : "bg-destructive/20 text-destructive group-hover:bg-destructive/30"
            )}>
              {trend.positive ? (
                <TrendingUp className="w-3.5 h-3.5" />
              ) : (
                <TrendingDown className="w-3.5 h-3.5" />
              )}
              <span>{trend.positive ? '+' : '-'}{trend.value}%</span>
            </div>
          )}
        </div>

        <div className="space-y-1">
          <p className="text-4xl font-bold text-foreground">{value}</p>
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          {description && (
            <p className="text-xs text-muted-foreground/70 mt-2">{description}</p>
          )}
        </div>
      </div>
    </div>
  );
}
