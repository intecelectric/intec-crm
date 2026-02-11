import { cn } from '@/lib/utils';
import { forwardRef } from 'react';

const variants = {
  default: 'bg-accent text-white hover:bg-accent-hover',
  secondary: 'bg-surface-light text-text-primary border border-border hover:bg-border',
  danger: 'bg-danger/10 text-danger border border-danger/20 hover:bg-danger/20',
  ghost: 'text-text-secondary hover:text-text-primary hover:bg-surface-light',
  outline: 'border border-border text-text-secondary hover:text-text-primary hover:border-border-light',
};

const sizes = {
  sm: 'px-3 py-1.5 text-xs',
  md: 'px-4 py-2 text-sm',
  lg: 'px-6 py-2.5 text-base',
  icon: 'p-2',
};

const Button = forwardRef(({ className, variant = 'default', size = 'md', children, ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        'inline-flex items-center justify-center gap-2 rounded-lg font-medium transition-colors duration-150 disabled:opacity-50 disabled:pointer-events-none cursor-pointer',
        variants[variant],
        sizes[size],
        className
      )}
      {...props}
    >
      {children}
    </button>
  );
});

Button.displayName = 'Button';
export { Button };
