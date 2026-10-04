import { Lightbulb } from 'lucide-react';
import { CategoryTotal } from '@/types';
import { formatCurrency } from '@/utils/currency';
import { useAuth } from '@/contexts/AuthContext';

interface InsightsPanelProps {
  expenses: number;
  income: number;
  categories: CategoryTotal[];
  savingsRate: number;
}

export default function InsightsPanel({ expenses, income, categories, savingsRate }: InsightsPanelProps) {
  const { currency } = useAuth();
  
  const generateInsights = () => {
    const insights: string[] = [];
    
    // Top category insight
    if (categories.length > 0) {
      const top = categories[0];
      if (top.percentage > 40) {
        insights.push(`Your highest expense is ${top.categoryName} at ${top.percentage}% of your total spending.`);
      } else {
        insights.push(`You spent ${formatCurrency(top.total, currency)} on ${top.categoryName} this period.`);
      }
    }
    
    // Savings insight
    if (income > 0) {
      if (savingsRate >= 20) {
        insights.push(`Great job! You saved ${savingsRate}% of your income this period.`);
      } else if (savingsRate > 0) {
        insights.push(`You saved ${savingsRate}% of your income. Try aiming for 20% next month.`);
      } else {
        insights.push(`Your expenses exceeded your income by ${formatCurrency(expenses - income, currency)}.`);
      }
    }
    
    // Fallback if no data
    if (insights.length === 0) {
      insights.push("Add more transactions to see personalized insights about your spending habits.");
    }
    
    return insights;
  };

  const insights = generateInsights();

  if (insights.length === 0) return null;

  return (
    <div className="card p-5 bg-gradient-to-br from-brand-50 to-brand-100 dark:from-brand-900/20 dark:to-brand-950/20 border-brand-200 dark:border-brand-800">
      <div className="flex items-center gap-2.5 mb-4">
        <div className="w-8 h-8 rounded-full bg-brand-500 flex items-center justify-center">
          <Lightbulb className="w-4 h-4 text-white" />
        </div>
        <h3 className="text-lg font-bold text-[var(--text-primary)]">Insights</h3>
      </div>
      
      <ul className="space-y-3">
        {insights.map((insight, index) => (
          <li key={index} className="flex gap-3 text-sm text-[var(--text-secondary)]">
            <span className="text-brand-500 font-bold">•</span>
            <span className="leading-relaxed">{insight}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
