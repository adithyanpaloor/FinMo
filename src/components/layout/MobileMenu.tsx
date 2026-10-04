import { NavLink, useNavigate } from 'react-router-dom';
import {
  PiggyBank,
  Landmark,
  Target,
  TrendingUp,
  RefreshCw,
  FileText,
  Settings,
  LogOut,
  X,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/services/auth';
import { clsx } from 'clsx';
import { useEffect } from 'react';

interface MobileMenuProps {
  isOpen: boolean;
  onClose: () => void;
}

const moreNavItems = [
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/accounts', icon: Landmark, label: 'Accounts' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function MobileMenu({ isOpen, onClose }: MobileMenuProps) {
  const { profile } = useAuth();
  const navigate = useNavigate();

  // Prevent scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex md:hidden">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-fade-in"
        onClick={onClose}
      />

      {/* Menu panel */}
      <div className="absolute right-0 top-0 bottom-0 w-3/4 max-w-sm bg-[var(--bg-secondary)] shadow-2xl animate-fade-in flex flex-col pt-safe pb-safe">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
              <Coins className="w-4 h-4 text-white" />
            </div>
            <span className="text-lg font-bold">Menu</span>
          </div>
          <button 
            onClick={onClose}
            className="p-2 -mr-2 text-[var(--text-secondary)] hover:text-[var(--text-primary)] rounded-full hover:bg-[var(--bg-tertiary)] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto py-2">
          <div className="px-4 py-2 text-xs font-semibold text-[var(--text-muted)] uppercase tracking-wider">
            Features
          </div>
          <nav className="space-y-1 px-2">
            {moreNavItems.map(({ to, icon: Icon, label }) => (
              <NavLink
                key={to}
                to={to}
                onClick={onClose}
                className={({ isActive }) =>
                  clsx(
                    'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                    isActive
                      ? 'bg-brand-500/10 text-brand-500 font-semibold'
                      : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                  )
                }
              >
                <Icon className="w-5 h-5" />
                {label}
              </NavLink>
            ))}
          </nav>
        </div>

        <div className="p-4 border-t border-[var(--border)] space-y-4">
          <div className="flex items-center gap-3 bg-[var(--bg-tertiary)] p-3 rounded-xl">
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
                {profile?.name}
              </p>
              <p className="text-xs text-[var(--text-muted)] truncate">
                {profile?.email}
              </p>
            </div>
          </div>

          <div className="space-y-1">
            <NavLink
              to="/settings"
              onClick={onClose}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-3 py-3 rounded-xl transition-colors',
                  isActive
                    ? 'bg-brand-500/10 text-brand-500 font-semibold'
                    : 'text-[var(--text-primary)] hover:bg-[var(--bg-tertiary)]'
                )
              }
            >
              <Settings className="w-5 h-5" />
              Settings
            </NavLink>
            
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-3 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 rounded-xl transition-colors text-left"
            >
              <LogOut className="w-5 h-5" />
              Logout
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
