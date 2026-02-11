import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const Select = forwardRef(({ className, label, options = [], placeholder, error, ...props }, ref) => {
  return (
    <div className="space-y-1">
      {label && <label className="block text-sm text-text-secondary">{label}</label>}
      <select
        ref={ref}
        className={cn(
          'w-full px-3 py-2 bg-surface border border-border rounded-lg text-text-primary text-sm',
          'focus:outline-none focus:border-accent focus:ring-1 focus:ring-accent/30',
          'transition-colors duration-150 appearance-none cursor-pointer',
          error && 'border-danger',
          className
        )}
        {...props}
      >
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        ))}
      </select>
      {error && <p className="text-xs text-danger">{error}</p>}
    </div>
  );
});

Select.displayName = 'Select';
export { Select };
