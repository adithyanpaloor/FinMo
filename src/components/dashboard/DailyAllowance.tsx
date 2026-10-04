import { CalendarDays } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';
import { getRemainingDaysInMonth } from '@/utils/calculations';

interface DailyAllowanceProps {
  dailyAllowance: number;
}

export default function DailyAllowance({ dailyAllowance }: DailyAllowanceProps) {
  const { currency } = useAuth();
  const remainingDays = getRemainingDaysInMonth();
  
  if (dailyAllowance <= 0) return null;

  return (
    <div className="card p-5 border-l-4 border-l-brand-500">
      <div className="flex items-center gap-3">
        <div className="w-10 h-10 rounded-full bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center shrink-0">
          <CalendarDays className="w-5 h-5 text-brand-500" />
        </div>
        <div>
          <p className="text-sm font-medium text-[var(--text-secondary)]">
            Suggested Daily Limit
          </p>
          <div className="flex items-baseline gap-2">
            <span className="text-2xl font-bold text-[var(--text-primary)]">
              {formatCurrency(dailyAllowance, currency)}
            </span>
            <span className="text-xs text-[var(--text-muted)]">
              for {remainingDays} remaining days
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
