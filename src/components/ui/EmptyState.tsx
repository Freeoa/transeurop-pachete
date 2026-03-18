import type { ReactNode } from 'react';
import { Package } from 'lucide-react';
import { Button } from './Button';

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: { label: string; onClick: () => void };
}

function EmptyState({ icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="animate-enter flex flex-col items-center justify-center py-12 px-4">
      <div className="text-text-tertiary/30 mb-4">
        {icon ?? <Package size={48} strokeWidth={1.5} />}
      </div>
      <p className="text-[15px] font-semibold text-text-secondary mb-1">{title}</p>
      {description && (
        <p className="text-[13px] text-text-tertiary text-center max-w-xs">{description}</p>
      )}
      {action && (
        <div className="mt-4">
          <Button variant="secondary" size="sm" onClick={action.onClick}>
            {action.label}
          </Button>
        </div>
      )}
    </div>
  );
}

export { EmptyState };
export type { EmptyStateProps };
