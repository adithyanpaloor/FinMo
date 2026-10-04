import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  PiggyBank,
  Landmark,
  Target,
  TrendingUp,
  RefreshCw,
  FileText,
  Settings,
  LogOut,
  Plus,
  Coins,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { logoutUser } from '@/services/auth';
import { clsx } from 'clsx';

const navItems = [
  { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
  { to: '/transactions', icon: CreditCard, label: 'Transactions' },
  { to: '/analytics', icon: BarChart3, label: 'Analytics' },
  { to: '/budgets', icon: PiggyBank, label: 'Budgets' },
  { to: '/accounts', icon: Landmark, label: 'Accounts' },
  { to: '/goals', icon: Target, label: 'Goals' },
  { to: '/investments', icon: TrendingUp, label: 'Investments' },
  { to: '/recurring', icon: RefreshCw, label: 'Recurring' },
  { to: '/reports', icon: FileText, label: 'Reports' },
];

export default function Sidebar() {
  const { profile } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logoutUser();
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col w-64 border-r border-[var(--border)] bg-[var(--bg-secondary)] shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2.5 px-6 py-5 border-b border-[var(--border)]">
        <div className="w-8 h-8 rounded-xl bg-brand-500 flex items-center justify-center">
          <Coins className="w-4 h-4 text-white" />
        </div>
        <span className="text-lg font-bold text-[var(--text-primary)]">FinMo</span>
      </div>

      {/* Add Expense Button */}
      <div className="px-4 pt-4">
        <button
          onClick={() => navigate('/add')}
          className="btn-primary btn-md w-full flex items-center justify-center gap-2"
        >
          <Plus className="w-4 h-4" />
          Add Transaction
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4 space-y-0.5 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              clsx('nav-link', isActive && 'active')
            }
          >
            <Icon className="w-4 h-4 shrink-0" />
            {label}
          </NavLink>
        ))}
      </nav>

      {/* Footer */}
      <div className="px-3 pb-4 border-t border-[var(--border)] pt-3">
        <NavLink
          to="/settings"
          className={({ isActive }) => clsx('nav-link', isActive && 'active')}
        >
          <Settings className="w-4 h-4 shrink-0" />
          Settings
        </NavLink>

        {/* User info */}
        <div className="mt-2 px-3 py-2 rounded-xl" style={{ backgroundColor: 'var(--bg-tertiary)' }}>
          <p className="text-xs font-semibold text-[var(--text-primary)] truncate">
            {profile?.name ?? 'User'}
          </p>
          <p className="text-xs text-[var(--text-muted)] truncate">{profile?.email}</p>
        </div>

        <button
          onClick={handleLogout}
          className="nav-link w-full mt-1 text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30"
        >
          <LogOut className="w-4 h-4 shrink-0" />
          Logout
        </button>
      </div>
    </aside>
  );
}
