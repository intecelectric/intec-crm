import { cn } from '@/lib/utils';

const statusColors = {
  // Job statuses
  LEAD: 'bg-info/10 text-info border-info/20',
  QUOTED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  SCHEDULED: 'bg-warning/10 text-warning border-warning/20',
  IN_PROGRESS: 'bg-accent/10 text-accent border-accent/20',
  COMPLETED: 'bg-success/10 text-success border-success/20',
  CANCELLED: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  // Invoice statuses
  DRAFT: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  SENT: 'bg-info/10 text-info border-info/20',
  VIEWED: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PAID: 'bg-success/10 text-success border-success/20',
  PARTIAL: 'bg-warning/10 text-warning border-warning/20',
  OVERDUE: 'bg-danger/10 text-danger border-danger/20',
  // Priority
  LOW: 'bg-text-muted/10 text-text-muted border-text-muted/20',
  MEDIUM: 'bg-info/10 text-info border-info/20',
  HIGH: 'bg-warning/10 text-warning border-warning/20',
  URGENT: 'bg-danger/10 text-danger border-danger/20',
  // Customer types
  RESIDENTIAL: 'bg-info/10 text-info border-info/20',
  COMMERCIAL: 'bg-purple-500/10 text-purple-400 border-purple-500/20',
  PROPERTY_MANAGER: 'bg-warning/10 text-warning border-warning/20',
};

function Badge({ children, variant, className }) {
  return (
    <span
      className={cn(
        'inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border',
        statusColors[variant] || 'bg-surface-light text-text-secondary border-border',
        className
      )}
    >
      {children}
    </span>
  );
}

export { Badge, statusColors };
