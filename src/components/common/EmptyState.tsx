import { LucideIcon } from 'lucide-react';
import { ReactNode } from 'react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}

export default function EmptyState({ icon: Icon, title, description, action }: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center p-8 text-center bg-[var(--bg-secondary)] border border-[var(--border)] rounded-2xl animate-fade-in">
      <div className="w-16 h-16 mb-4 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
        <Icon className="w-8 h-8 text-brand-500" />
      </div>
      <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">{title}</h3>
      <p className="text-sm text-[var(--text-secondary)] max-w-sm mb-6 leading-relaxed">
        {description}
      </p>
      {action && <div>{action}</div>}
    </div>
  );
}
