import { Transaction, ReportData, Account, TransactionType } from '@/types';
import { ALL_CATEGORIES } from '@/utils/constants';
import { formatCurrency } from '@/utils/currency';
import { formatDate, toTimestamp } from '@/utils/dates';
import { getAccounts } from './accounts';
import { getTransactionsByDateRange } from './transactions';
import {
  calculateTotalIncome,
  calculateTotalExpenses,
  calculateTotalSavings,
  calculateSavingsRate,
  calculateCategoryTotals,
  calculateTotalInvestments,
} from '@/utils/calculations';

export async function generateReport(
  uid: string,
  start: Date,
  end: Date
): Promise<ReportData> {
  const [transactions, accounts] = await Promise.all([
    getTransactionsByDateRange(uid, start, end),
    getAccounts(uid),
  ]);

  const totalIncome = calculateTotalIncome(transactions);
  const totalExpenses = calculateTotalExpenses(transactions);
  const totalSavings = calculateTotalSavings(transactions);
  const savingsRate = calculateSavingsRate(transactions);
  const categoryBreakdown = calculateCategoryTotals(transactions);
  const investmentTotal = calculateTotalInvestments(transactions);

  const largestTransactions = [...transactions]
    .filter((t) => t.type === 'expense')
    .sort((a, b) => b.amount - a.amount)
    .slice(0, 10);

  return {
    period: { start, end },
    totalIncome,
    totalExpenses,
    totalSavings,
    savingsRate,
    categoryBreakdown,
    accountBalances: accounts,
    largestTransactions,
    transactionCount: transactions.length,
    investmentTotal,
  };
}

// ─── CSV Export ───────────────────────────────────────────────────────────────

function csvCell(v: string): string {
  // Prevent spreadsheet formula injection (=, +, -, @) in text cells.
  const safe = /^[=+@]/.test(v) ? `'${v}` : v;
  return `"${safe.replace(/"/g, '""')}"`;
}

export function exportToCSV(transactions: Transaction[]): string {
  const headers = [
    'Date',
    'Type',
    'Amount',
    'Category',
    'Merchant',
    'Account',
    'Payment Method',
    'Description',
    'Tags',
  ];

  const rows = transactions.map((t) => {
    const date =
      t.date && typeof (t.date as unknown as { toDate?: () => Date }).toDate === 'function'
        ? (t.date as unknown as { toDate: () => Date }).toDate().toISOString().split('T')[0]
        : String(t.date);

    return [
      date,
      t.type,
      t.amount.toString(),
      t.categoryName ?? '',
      t.merchant ?? '',
      t.accountName ?? t.accountId,
      t.paymentMethod ?? '',
      t.description ?? '',
      (t.tags ?? []).join(';'),
    ]
      .map(csvCell)
      .join(',');
  });

  return [headers.join(','), ...rows].join('\n');
}

// ─── Generate CSV Report (full export) ───────────────────────────────────────

export async function generateCSVReport(
  uid: string,
  currency: string,
  startDate?: Date,
  endDate?: Date
): Promise<string> {
  const transactions = await getTransactionsByDateRange(
    uid,
    startDate ?? new Date(2000, 0, 1),
    endDate ?? new Date(2100, 11, 31)
  );
  return exportToCSV(transactions);
}

// ─── Available report months ─────────────────────────────────────────────────

export function getAvailableReportMonths(
  count: number
): { value: string; date: Date }[] {
  const result: { value: string; date: Date }[] = [];
  const now = new Date();
  for (let i = 0; i < count; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const value = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
    result.push({ value, date: d });
  }
  return result;
}

// ─── CSV Parse (RFC-4180-ish: quotes, escaped quotes, CRLF, newlines in cells) ─

export function parseCSV(csvText: string): Record<string, string>[] {
  const rows: string[][] = [];
  let row: string[] = [];
  let cell = '';
  let inQuotes = false;
  const text = csvText.replace(/^\uFEFF/, '');

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQuotes) {
      if (c === '"' && text[i + 1] === '"') {
        cell += '"';
        i++;
      } else if (c === '"') {
        inQuotes = false;
      } else {
        cell += c;
      }
    } else if (c === '"') {
      inQuotes = true;
    } else if (c === ',') {
      row.push(cell);
      cell = '';
    } else if (c === '\n' || c === '\r') {
      if (c === '\r' && text[i + 1] === '\n') i++;
      row.push(cell);
      cell = '';
      if (row.some((v) => v.trim() !== '')) rows.push(row);
      row = [];
    } else {
      cell += c;
    }
  }
  row.push(cell);
  if (row.some((v) => v.trim() !== '')) rows.push(row);

  if (rows.length < 2) return [];
  const headers = rows[0].map((h) => h.trim().toLowerCase());
  return rows.slice(1).map((r) => {
    const obj: Record<string, string> = {};
    headers.forEach((h, i) => {
      obj[h] = (r[i] ?? '').trim();
    });
    return obj;
  });
}

// ─── CSV Import mapping ───────────────────────────────────────────────────────

export interface ImportResult {
  valid: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[];
  errors: string[];
}

/** Turns parsed CSV rows (same columns as the export) into transactions. */
export function mapCSVToTransactions(
  rows: Record<string, string>[],
  accounts: Account[]
): ImportResult {
  const valid: ImportResult['valid'] = [];
  const errors: string[] = [];
  const types: TransactionType[] = ['expense', 'income', 'transfer', 'investment'];

  rows.forEach((r, i) => {
    const line = i + 2; // header is line 1
    const type = (r['type'] || '').toLowerCase() as TransactionType;
    const amount = parseFloat((r['amount'] || '').replace(/[^0-9.\-]/g, ''));
    const date = new Date(r['date']);
    const account =
      accounts.find((a) => a.name.toLowerCase() === (r['account'] || '').toLowerCase()) ??
      accounts.find((a) => a.id === r['account']);

    if (!types.includes(type)) return void errors.push(`Line ${line}: invalid type "${r['type']}"`);
    if (!(amount > 0)) return void errors.push(`Line ${line}: invalid amount "${r['amount']}"`);
    if (isNaN(date.getTime())) return void errors.push(`Line ${line}: invalid date "${r['date']}"`);
    if (!account) return void errors.push(`Line ${line}: unknown account "${r['account']}"`);
    if (type === 'transfer') return void errors.push(`Line ${line}: transfers can't be imported`);

    const catName = (r['category'] || '').toLowerCase();
    const category = ALL_CATEGORIES.find(
      (c) => c.name.toLowerCase() === catName && (type === 'income' ? c.type === 'income' : c.type === 'expense')
    );

    valid.push({
      type,
      amount,
      categoryId: category?.id,
      categoryName: category?.name ?? (r['category'] || undefined),
      categoryIcon: category?.icon,
      categoryColor: category?.color,
      merchant: r['merchant'] || undefined,
      description: r['description'] || r['note'] || undefined,
      paymentMethod: r['payment method'] || undefined,
      accountId: account.id,
      accountName: account.name,
      date: toTimestamp(date),
      tags: r['tags'] ? r['tags'].split(';').filter(Boolean) : undefined,
    });
  });

  return { valid, errors };
}

// ─── Printable PDF summary ────────────────────────────────────────────────────

const esc = (v: unknown) =>
  String(v ?? '').replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]!));

/** Opens a print-ready report. The user chooses "Save as PDF" in the print dialog. */
export function openPrintableReport(report: ReportData, currency: string, title: string): boolean {
  const w = window.open('', '_blank');
  if (!w) return false;
  const f = (n: number) => formatCurrency(n, currency);

  const catRows = report.categoryBreakdown
    .map((c) => `<tr><td>${esc(c.categoryIcon ?? '')} ${esc(c.categoryName)}</td><td class="r">${c.count}</td><td class="r">${f(c.total)}</td><td class="r">${c.percentage}%</td></tr>`)
    .join('');
  const topRows = report.largestTransactions
    .map((t) => `<tr><td>${esc(formatDate(t.date))}</td><td>${esc(t.merchant || t.categoryName || '-')}</td><td>${esc(t.categoryName ?? '')}</td><td class="r">${f(t.amount)}</td></tr>`)
    .join('');
  const accRows = report.accountBalances
    .map((a) => `<tr><td>${esc(a.name)}</td><td>${esc(a.type)}</td><td class="r">${f(a.currentBalance)}</td></tr>`)
    .join('');

  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(title)}</title>
<style>
  body{font-family:Inter,system-ui,sans-serif;color:#0f172a;margin:32px;}
  h1{margin:0 0 4px;font-size:24px} h2{font-size:16px;margin:28px 0 8px}
  .muted{color:#64748b;font-size:13px}
  .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:12px;margin-top:16px}
  .box{border:1px solid #e2e8f0;border-radius:10px;padding:12px}
  .box b{display:block;font-size:18px;margin-top:4px}
  table{width:100%;border-collapse:collapse;font-size:13px}
  th,td{padding:7px 8px;border-bottom:1px solid #e2e8f0;text-align:left}
  th{background:#f8fafc} .r{text-align:right}
  @media print{body{margin:12mm}}
</style></head><body>
<h1>FinMo Report</h1>
<div class="muted">${esc(title)} · ${report.transactionCount} transactions</div>
<div class="grid">
  <div class="box">Income<b>${f(report.totalIncome)}</b></div>
  <div class="box">Expenses<b>${f(report.totalExpenses)}</b></div>
  <div class="box">Investments<b>${f(report.investmentTotal)}</b></div>
  <div class="box">Savings<b>${f(report.totalSavings)}</b><span class="muted">${report.savingsRate}% of income</span></div>
</div>
<h2>Spending by category</h2>
<table><tr><th>Category</th><th class="r">Count</th><th class="r">Amount</th><th class="r">Share</th></tr>${catRows || '<tr><td colspan="4">No expenses</td></tr>'}</table>
<h2>Largest expenses</h2>
<table><tr><th>Date</th><th>Merchant</th><th>Category</th><th class="r">Amount</th></tr>${topRows || '<tr><td colspan="4">None</td></tr>'}</table>
<h2>Account balances (today)</h2>
<table><tr><th>Account</th><th>Type</th><th class="r">Balance</th></tr>${accRows}</table>
<script>window.onload=function(){setTimeout(function(){window.print()},250)}</script>
</body></html>`);
  w.document.close();
  return true;
}
