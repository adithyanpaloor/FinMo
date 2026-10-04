import { useRef, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useAccounts } from '@/hooks/useAccounts';
import { useInvalidateFinance } from '@/hooks/useTransactions';
import { FileText, Download, Upload, Calendar, Loader2, AlertCircle } from 'lucide-react';
import {
  generateCSVReport,
  generateReport,
  getAvailableReportMonths,
  openPrintableReport,
  parseCSV,
  mapCSVToTransactions,
} from '@/services/reports';
import { importTransactions } from '@/services/transactions';
import { formatMonth, endOfDay } from '@/utils/dates';
import toast from 'react-hot-toast';

export default function Reports() {
  const { user, currency } = useAuth();
  const { data: accounts = [] } = useAccounts();
  const invalidate = useInvalidateFinance();
  const fileRef = useRef<HTMLInputElement>(null);

  const [busy, setBusy] = useState<'csv' | 'pdf' | 'import' | null>(null);
  const [selectedMonth, setSelectedMonth] = useState<string>('');
  const [importErrors, setImportErrors] = useState<string[]>([]);

  const monthOptions = getAvailableReportMonths(12);

  const getRange = (): { start?: Date; end?: Date } => {
    if (!selectedMonth) return {};
    const [y, m] = selectedMonth.split('-').map(Number);
    // end = last day of month at 23:59:59.999 so the final day is included
    return { start: new Date(y, m - 1, 1), end: endOfDay(new Date(y, m, 0)) };
  };

  const handleDownloadCSV = async () => {
    if (!user) return;
    try {
      setBusy('csv');
      const { start, end } = getRange();
      const csv = await generateCSVReport(user.uid, currency, start, end);
      const blob = new Blob(['\uFEFF' + csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = selectedMonth
        ? `finmo_report_${selectedMonth}.csv`
        : `finmo_full_report_${new Date().toISOString().split('T')[0]}.csv`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      toast.success('Report downloaded');
    } catch (error) {
      toast.error('Failed to generate report');
      console.error(error);
    } finally {
      setBusy(null);
    }
  };

  const handlePDF = async () => {
    if (!user) return;
    try {
      setBusy('pdf');
      const now = new Date();
      const { start, end } = getRange();
      const s = start ?? new Date(now.getFullYear(), now.getMonth(), 1);
      const e = end ?? endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0));
      const report = await generateReport(user.uid, s, e);
      const title = formatMonth(s);
      if (!openPrintableReport(report, currency, title)) {
        toast.error('Pop-up blocked — allow pop-ups to open the report');
      }
    } catch (error) {
      toast.error('Failed to generate PDF summary');
      console.error(error);
    } finally {
      setBusy(null);
    }
  };

  const handleImport = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file || !user) return;
    if (accounts.length === 0) return void toast.error('Create an account before importing');
    try {
      setBusy('import');
      setImportErrors([]);
      const rows = parseCSV(await file.text());
      if (rows.length === 0) return void toast.error('No rows found in that file');
      const { valid, errors } = mapCSVToTransactions(rows, accounts);
      setImportErrors(errors);
      if (valid.length === 0) return void toast.error('No valid rows to import');
      const n = await importTransactions(user.uid, valid);
      invalidate();
      toast.success(`Imported ${n} transaction${n === 1 ? '' : 's'}${errors.length ? ` (${errors.length} skipped)` : ''}`);
    } catch (error) {
      toast.error('Import failed');
      console.error(error);
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Reports</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Export, summarize and import your financial data
        </p>
      </div>

      <div className="card p-6">
        <label className="label flex items-center gap-2">
          <Calendar className="w-4 h-4" />
          Period (applies to CSV export and PDF summary)
        </label>
        <select
          className="input max-w-sm"
          value={selectedMonth}
          onChange={(e) => setSelectedMonth(e.target.value)}
        >
          <option value="">All time (CSV) / current month (PDF)</option>
          {monthOptions.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {formatMonth(opt.date)}
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="card p-6 flex flex-col">
          <div className="w-12 h-12 bg-brand-50 dark:bg-brand-900/20 rounded-xl flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-brand-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">CSV Export</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Download transactions for Excel, Google Sheets or tax filing.
          </p>
          <button onClick={handleDownloadCSV} disabled={busy !== null} className="btn-primary w-full py-3">
            {busy === 'csv' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Download CSV</>}
          </button>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="w-12 h-12 bg-red-50 dark:bg-red-900/20 rounded-xl flex items-center justify-center mb-6">
            <FileText className="w-6 h-6 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">PDF Summary</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Income, spending by category, top expenses and balances. Choose “Save as PDF” in the print dialog.
          </p>
          <button onClick={handlePDF} disabled={busy !== null} className="btn-primary w-full py-3">
            {busy === 'pdf' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Download className="w-5 h-5" /> Open PDF Summary</>}
          </button>
        </div>

        <div className="card p-6 flex flex-col">
          <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-xl flex items-center justify-center mb-6">
            <Upload className="w-6 h-6 text-green-500" />
          </div>
          <h3 className="text-lg font-bold text-[var(--text-primary)] mb-2">CSV Import</h3>
          <p className="text-sm text-[var(--text-secondary)] mb-6 flex-1">
            Import a file using the same columns as the export (Date, Type, Amount, Category, Merchant, Account, Description).
          </p>
          <input ref={fileRef} type="file" accept=".csv,text/csv" className="hidden" onChange={handleImport} />
          <button onClick={() => fileRef.current?.click()} disabled={busy !== null} className="btn-secondary w-full py-3">
            {busy === 'import' ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Upload className="w-5 h-5" /> Choose CSV file</>}
          </button>
        </div>
      </div>

      {importErrors.length > 0 && (
        <div className="card p-4 border-yellow-300 dark:border-yellow-800">
          <p className="font-semibold text-[var(--text-primary)] mb-2">
            {importErrors.length} row{importErrors.length === 1 ? '' : 's'} skipped
          </p>
          <ul className="text-sm text-[var(--text-secondary)] list-disc pl-5 max-h-40 overflow-y-auto space-y-0.5">
            {importErrors.slice(0, 50).map((er, i) => (
              <li key={i}>{er}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-500 shrink-0 mt-0.5" />
        <p className="text-sm text-blue-800 dark:text-blue-300">
          <strong>Privacy note:</strong> Reports are generated in your browser from your own data.
        </p>
      </div>
    </div>
  );
}
