import { useLocation } from 'react-router-dom';
import { Coins } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/transactions': 'Transactions',
  '/add': 'Add Transaction',
  '/analytics': 'Analytics',
  '/budgets': 'Budgets',
  '/accounts': 'Accounts',
  '/goals': 'Goals',
  '/investments': 'Investments',
  '/recurring': 'Recurring Payments',
  '/reports': 'Reports',
  '/settings': 'Settings',
};

export default function TopBar() {
  const location = useLocation();
  const { profile } = useAuth();
  
  const title = routeNames[location.pathname] || 'FinMo';

  return (
    <header className="md:hidden flex items-center justify-between px-4 py-3 bg-[var(--bg-secondary)] border-b border-[var(--border)] sticky top-0 z-30 pt-safe">
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-brand-500 flex items-center justify-center">
          <Coins className="w-4 h-4 text-white" />
        </div>
        <h1 className="text-lg font-bold text-[var(--text-primary)]">{title}</h1>
      </div>
      
      {profile && (
        <div className="flex items-center">
          <div className="w-8 h-8 rounded-full bg-brand-100 dark:bg-brand-900/30 flex items-center justify-center text-brand-600 dark:text-brand-400 font-bold text-sm">
            {profile.name?.charAt(0).toUpperCase() || 'U'}
          </div>
        </div>
      )}
    </header>
  );
}
