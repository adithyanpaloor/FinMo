import { useMemo } from 'react';
import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  Legend,
} from 'recharts';
import { CategoryTotal } from '@/types';
import EmptyState from '../common/EmptyState';
import { PieChart as PieChartIcon } from 'lucide-react';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';

interface ExpenseBreakdownChartProps {
  data: CategoryTotal[];
}

export default function ExpenseBreakdownChart({ data }: ExpenseBreakdownChartProps) {
  const { currency } = useAuth();
  
  const chartData = useMemo(() => {
    // Only show top 5 + Others
    if (data.length <= 6) return data;
    
    const top5 = data.slice(0, 5);
    const others = data.slice(5).reduce((acc, curr) => acc + curr.total, 0);
    
    if (others > 0) {
      top5.push({
        categoryId: 'others',
        categoryName: 'Others',
        categoryColor: '#94a3b8',
        total: others,
        percentage: 0, // calculate later if needed
        count: 0
      });
    }
    return top5;
  }, [data]);

  if (chartData.length === 0) {
    return (
      <div className="card p-5 h-[350px] flex flex-col">
        <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Expense Breakdown</h3>
        <div className="flex-1 flex items-center justify-center">
          <EmptyState 
            icon={PieChartIcon}
            title="No Expenses"
            description="Add some expenses to see your breakdown."
          />
        </div>
      </div>
    );
  }

  return (
    <div className="card p-5 h-[350px] flex flex-col">
      <h3 className="text-lg font-bold mb-4 text-[var(--text-primary)]">Expense Breakdown</h3>
      <div className="flex-1 min-h-0 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={chartData}
              cx="50%"
              cy="50%"
              innerRadius={60}
              outerRadius={90}
              paddingAngle={5}
              dataKey="total"
              nameKey="categoryName"
              stroke="none"
            >
              {chartData.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.categoryColor} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value) => formatCurrency(Number(value), currency)}
              contentStyle={{ 
                backgroundColor: 'var(--bg-secondary)', 
                borderColor: 'var(--border)',
                borderRadius: '8px',
                color: 'var(--text-primary)'
              }}
            />
            <Legend 
              layout="vertical" 
              verticalAlign="middle" 
              align="right"
              wrapperStyle={{ fontSize: '12px' }}
            />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
