import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Input = forwardRef(({ className, label, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-text-secondary">{label}</label>}
      <input
        ref={ref}
        className={cn(
          'w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm',
          'placeholder:text-text-muted focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-colors duration-150',
          error && 'border-danger focus:border-danger focus:ring-danger/30',
          className
        )}
        {...props}
      />
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

Input.displayName = 'Input';
export { Input };
