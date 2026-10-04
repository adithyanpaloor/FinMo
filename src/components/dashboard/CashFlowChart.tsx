import { useMemo } from 'react';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { Transaction } from '@/types';
import { format, eachDayOfInterval } from 'date-fns';

interface CashFlowChartProps {
  transactions: Transaction[];
  startDate: Date;
  endDate: Date;
}

export default function CashFlowChart({ transactions, startDate, endDate }: CashFlowChartProps) {
  const data = useMemo(() => {
    const days = eachDayOfInterval({ start: startDate, end: endDate });
    
    const dayMap = new Map();
    days.forEach(day => {
      dayMap.set(format(day, 'yyyy-MM-dd'), {
        date: format(day, 'dd MMM'),
        income: 0,
        expense: 0,
      });
    });

    transactions.forEach(t => {
      const dateStr = format(
        t.date && typeof (t.date as any).toDate === 'function' ? (t.date as any).toDate() : new Date(t.date as unknown as string),
        'yyyy-MM-dd'
      );
      const dayData = dayMap.get(dateStr);
      if (dayData) {
        if (t.type === 'income') dayData.income += t.amount;
        else if (t.type === 'expense') dayData.expense += t.amount;
      }
    });

    return Array.from(dayMap.values());
  }, [transactions, startDate, endDate]);

  return (
    <div className="card p-5 h-[350px] flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Cash Flow</h3>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={data} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--border)" />
            <XAxis 
              dataKey="date" 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              dy={10}
              minTickGap={20}
            />
            <YAxis 
              axisLine={false}
              tickLine={false}
              tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
              tickFormatter={(value) => value >= 1000 ? `${(value/1000).toFixed(0)}k` : value}
            />
            <Tooltip 
              cursor={{ fill: 'var(--bg-tertiary)' }}
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend wrapperStyle={{ paddingTop: '10px' }} />
            <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} maxBarSize={40} />
            <Bar dataKey="expense" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} maxBarSize={40} />
          </BarChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
