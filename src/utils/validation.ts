import { z } from 'zod';

// ─── Transaction ─────────────────────────────────────────────────────────────

export const transactionSchema = z.object({
  type: z.enum(['expense', 'income', 'transfer', 'investment']),
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  categoryId: z.string().optional(),
  categoryName: z.string().optional(),
  merchant: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  accountId: z.string().min(1, 'Account is required'),
  toAccountId: z.string().optional(),
  paymentMethod: z.string().optional(),
  date: z.string().min(1, 'Date is required'),
  tags: z.string().optional(),
  isRecurring: z.boolean().optional(),
}).superRefine((data, ctx) => {
  if (data.type === 'expense' && !data.categoryId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Category is required for expenses',
      path: ['categoryId'],
    });
  }
  if (data.type === 'transfer' && !data.toAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Destination account is required for transfers',
      path: ['toAccountId'],
    });
  }
  if (data.type === 'transfer' && data.accountId === data.toAccountId) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Source and destination accounts must be different',
      path: ['toAccountId'],
    });
  }
});

export type TransactionFormValues = z.infer<typeof transactionSchema>;

// ─── Account ─────────────────────────────────────────────────────────────────

export const accountSchema = z.object({
  name: z.string().min(1, 'Account name is required').max(50),
  type: z.enum(['cash', 'bank', 'upi', 'credit_card', 'wallet', 'investment', 'other']),
  openingBalance: z.number(),
  currency: z.string().min(1, 'Currency is required'),
  color: z.string().optional(),
});

export type AccountFormValues = z.infer<typeof accountSchema>;

// ─── Budget ──────────────────────────────────────────────────────────────────

export const budgetSchema = z.object({
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  amount: z
    .number()
    .positive('Budget must be greater than 0'),
  month: z.number().min(1).max(12),
  year: z.number().min(2020).max(2100),
});

export type BudgetFormValues = z.infer<typeof budgetSchema>;

// ─── Goal ────────────────────────────────────────────────────────────────────

export const goalSchema = z.object({
  name: z.string().min(1, 'Goal name is required').max(100),
  targetAmount: z
    .number()
    .positive('Target must be greater than 0'),
  currentAmount: z
    .number()
    .min(0),
  deadline: z.string().optional(),
  description: z.string().max(500).optional(),
  icon: z.string().optional(),
  color: z.string().optional(),
});

export type GoalFormValues = z.infer<typeof goalSchema>;

// ─── Goal Contribution ───────────────────────────────────────────────────────

export const goalContributionSchema = z.object({
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  type: z.enum(['add', 'withdraw']),
});

export type GoalContributionValues = z.infer<typeof goalContributionSchema>;

// ─── Investment ──────────────────────────────────────────────────────────────

export const investmentSchema = z.object({
  name: z.string().min(1, 'Investment name is required').max(100),
  type: z.enum(['mutual_fund', 'stocks', 'fd', 'gold', 'other']),
  amountInvested: z
    .number()
    .positive('Amount must be greater than 0'),
  currentValue: z.number().min(0).optional(),
  date: z.string().min(1, 'Date is required'),
  accountId: z.string().min(1, 'Account is required'),
  notes: z.string().max(500).optional(),
});

export type InvestmentFormValues = z.infer<typeof investmentSchema>;

// ─── Recurring Payment ───────────────────────────────────────────────────────

export const recurringSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  amount: z
    .number()
    .positive('Amount must be greater than 0'),
  categoryId: z.string().min(1, 'Category is required'),
  categoryName: z.string().optional(),
  accountId: z.string().min(1, 'Account is required'),
  frequency: z.enum(['daily', 'weekly', 'monthly', 'yearly']),
  nextDate: z.string().min(1, 'Next date is required'),
  description: z.string().max(500).optional(),
});

export type RecurringFormValues = z.infer<typeof recurringSchema>;

// ─── CSV Import Row ──────────────────────────────────────────────────────────

export const csvRowSchema = z.object({
  date: z.string().min(1, 'Date required'),
  amount: z.coerce.number().positive('Amount must be positive'),
  type: z.enum(['expense', 'income', 'transfer', 'investment']),
  category: z.string().optional(),
  merchant: z.string().optional(),
  account: z.string().optional(),
  note: z.string().optional(),
});

export type CSVRow = z.infer<typeof csvRowSchema>;

// ─── Settings ────────────────────────────────────────────────────────────────

export const settingsSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  currency: z.string().min(1),
  theme: z.enum(['light', 'dark', 'system']),
});

export type SettingsFormValues = z.infer<typeof settingsSchema>;

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(6, 'Current password required'),
  newPassword: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});
