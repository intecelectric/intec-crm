import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Textarea = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-text-secondary">{label}</label>}
      <textarea
        ref={ref}
        className={cn(
          'w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm',
          'placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-colors duration-150 resize-y min-h-[80px]',
          error && 'border-danger',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

Textarea.displayName = 'Textarea';
export { Textarea };
