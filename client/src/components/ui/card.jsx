import { cn } from '@/lib/utils';

function Card({ className, children, ...props }) {
  return (
    <div
      className={cn('bg-surface border border-border rounded-xl p-5', className)}
      {...props}
    >
      {children}
    </div>
  );
}

function CardHeader({ className, children }) {
  return <div className={cn('mb-4', className)}>{children}</div>;
}

function CardTitle({ className, children }) {
  return <h3 className={cn('text-lg font-heading font-semibold text-text-primary', className)}>{children}</h3>;
}

function CardContent({ className, children }) {
  return <div className={cn('', className)}>{children}</div>;
}

export { Card, CardHeader, CardTitle, CardContent };
