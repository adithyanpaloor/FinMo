import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { RecurringPayment, RecurringFormData } from '@/types';
import { toTimestamp } from '@/utils/dates';
import { addMonths, addWeeks, addDays, addYears } from 'date-fns';

const recCol = (uid: string) => collection(db, 'users', uid, 'recurringPayments');
const recDoc = (uid: string, id: string) =>
  doc(db, 'users', uid, 'recurringPayments', id);

export async function getRecurringPayments(uid: string): Promise<RecurringPayment[]> {
  const q = query(recCol(uid), orderBy('nextDate', 'asc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as RecurringPayment[];
}

export async function addRecurringPayment(
  uid: string,
  data: RecurringFormData & { accountName?: string; categoryIcon?: string }
): Promise<string> {
  const now = serverTimestamp();
  const nextDate = toTimestamp(data.nextDate);
  const ref = await addDoc(recCol(uid), {
    ...data,
    nextDate,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateRecurringPayment(
  uid: string,
  id: string,
  data: Partial<RecurringFormData>
): Promise<void> {
  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.nextDate) updates.nextDate = toTimestamp(data.nextDate);
  await updateDoc(recDoc(uid, id), updates);
}

export async function deleteRecurringPayment(uid: string, id: string): Promise<void> {
  await deleteDoc(recDoc(uid, id));
}

export function getNextOccurrence(
  currentDate: Date,
  frequency: RecurringPayment['frequency']
): Date {
  switch (frequency) {
    case 'daily': return addDays(currentDate, 1);
    case 'weekly': return addWeeks(currentDate, 1);
    case 'monthly': return addMonths(currentDate, 1);
    case 'yearly': return addYears(currentDate, 1);
  }
}

export async function markRecurringAsPaid(
  uid: string,
  recurring: RecurringPayment
): Promise<void> {
  const nextDate = getNextOccurrence(recurring.nextDate.toDate(), recurring.frequency);
  await updateDoc(recDoc(uid, recurring.id), {
    nextDate: toTimestamp(nextDate),
    updatedAt: serverTimestamp(),
  });
}
