// Currency formatting utilities

export type CurrencyCode = 'INR' | 'USD' | 'EUR' | 'GBP' | 'JPY';

const CURRENCY_SYMBOLS: Record<string, string> = {
  INR: '₹',
  USD: '$',
  EUR: '€',
  GBP: '£',
  JPY: '¥',
};

export function getCurrencySymbol(currency: string): string {
  return CURRENCY_SYMBOLS[currency] ?? currency;
}

export function formatCurrency(
  amount: number,
  currency = 'INR',
  options: { compact?: boolean; showSign?: boolean } = {}
): string {
  const { compact = false, showSign = false } = options;
  const symbol = getCurrencySymbol(currency);
  const abs = Math.abs(amount);

  let formatted: string;

  if (compact && abs >= 1_00_000) {
    // Indian lakh notation
    formatted = `${symbol}${(abs / 1_00_000).toFixed(1)}L`;
  } else if (compact && abs >= 1_000) {
    formatted = `${symbol}${(abs / 1_000).toFixed(1)}K`;
  } else {
    // Indian number format: 1,00,000
    if (currency === 'INR') {
      const parts = abs.toFixed(2).split('.');
      const intPart = parts[0];
      const decPart = parts[1];
      // Apply Indian grouping: last 3 digits then groups of 2
      let result = '';
      if (intPart.length > 3) {
        result = intPart.slice(-3);
        let remaining = intPart.slice(0, -3);
        while (remaining.length > 2) {
          result = remaining.slice(-2) + ',' + result;
          remaining = remaining.slice(0, -2);
        }
        result = remaining + ',' + result;
      } else {
        result = intPart;
      }
      formatted = `${symbol}${result}.${decPart}`;
    } else {
      formatted = new Intl.NumberFormat('en-US', {
        style: 'currency',
        currency,
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      }).format(abs);
    }
  }

  if (showSign && amount > 0) return `+${formatted}`;
  if (amount < 0) return `-${formatted}`;
  return formatted;
}

export function formatAmount(amount: number, currency = 'INR'): string {
  return formatCurrency(amount, currency);
}

export function parseCurrencyInput(value: string): number {
  // Remove any currency symbols, commas, spaces
  const cleaned = value.replace(/[₹$€£¥,\s]/g, '').trim();
  const parsed = parseFloat(cleaned);
  return isNaN(parsed) ? 0 : parsed;
}

export function formatPercentage(value: number, decimals = 1): string {
  return `${value.toFixed(decimals)}%`;
}
