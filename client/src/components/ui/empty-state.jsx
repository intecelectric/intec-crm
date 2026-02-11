import { cn } from '@/lib/utils';

function EmptyState({ icon: Icon, title, description, action, className }) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-12 text-center', className)}>
      {Icon && <Icon size={48} className="text-text-muted mb-4" strokeWidth={1} />}
      <h3 className="text-lg font-medium text-text-secondary mb-1">{title}</h3>
      {description && <p className="text-sm text-text-muted mb-4 max-w-sm">{description}</p>}
      {action}
    </div>
  );
}

export { EmptyState };
