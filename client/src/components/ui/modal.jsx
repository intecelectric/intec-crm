import { cn } from '@/lib/utils';
import { X } from 'lucide-react';
import { useEffect } from 'react';

function Modal({ open, onClose, title, children, className, size = 'md' }) {
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => { document.body.style.overflow = ''; };
  }, [open]);

  if (!open) return null;

  const sizes = {
    sm: 'max-w-md',
    md: 'max-w-lg',
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-6xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/60" onClick={onClose} />
      <div className={cn(
        'relative w-full bg-surface border border-border rounded-xl shadow-2xl max-h-[90vh] flex flex-col',
        sizes[size],
        className
      )}>
        <div className="flex items-center justify-between p-5 border-b border-border">
          <h2 className="text-lg font-heading font-semibold">{title}</h2>
          <button onClick={onClose} className="p-1 text-text-muted hover:text-text-primary transition-colors cursor-pointer">
            <X size={20} />
          </button>
        </div>
        <div className="p-5 overflow-y-auto flex-1">
          {children}
        </div>
      </div>
    </div>
  );
}

export { Modal };
