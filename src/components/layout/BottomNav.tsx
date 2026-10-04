import { NavLink, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard,
  CreditCard,
  BarChart3,
  Menu,
  Plus,
} from 'lucide-react';
import { clsx } from 'clsx';
import { useState } from 'react';
import MobileMenu from './MobileMenu';

export default function BottomNav() {
  const navigate = useNavigate();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <>
      <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-secondary)] border-t border-[var(--border)] px-6 py-3 flex items-center justify-between z-40 pb-safe">
        <NavLink
          to="/"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
              isActive ? 'text-brand-500' : 'text-[var(--text-secondary)]'
            )
          }
        >
          <LayoutDashboard className="w-5 h-5" />
          <span className="text-[10px] font-medium">Home</span>
        </NavLink>

        <NavLink
          to="/transactions"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
              isActive ? 'text-brand-500' : 'text-[var(--text-secondary)]'
            )
          }
        >
          <CreditCard className="w-5 h-5" />
          <span className="text-[10px] font-medium">History</span>
        </NavLink>

        {/* Floating Action Button */}
        <div className="relative -top-5">
          <button
            onClick={() => navigate('/add')}
            className="w-14 h-14 rounded-full bg-brand-500 text-white shadow-lg flex items-center justify-center hover:bg-brand-600 hover:scale-105 transition-transform active:scale-95 border-4 border-[var(--bg-primary)]"
          >
            <Plus className="w-6 h-6" />
          </button>
        </div>

        <NavLink
          to="/analytics"
          className={({ isActive }) =>
            clsx(
              'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
              isActive ? 'text-brand-500' : 'text-[var(--text-secondary)]'
            )
          }
        >
          <BarChart3 className="w-5 h-5" />
          <span className="text-[10px] font-medium">Insights</span>
        </NavLink>

        <button
          onClick={() => setMenuOpen(true)}
          className={clsx(
            'flex flex-col items-center gap-1 p-2 rounded-xl transition-colors',
            menuOpen ? 'text-brand-500' : 'text-[var(--text-secondary)]'
          )}
        >
          <Menu className="w-5 h-5" />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </nav>

      <MobileMenu isOpen={menuOpen} onClose={() => setMenuOpen(false)} />
    </>
  );
}
