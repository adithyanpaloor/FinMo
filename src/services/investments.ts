import {
  collection,
  doc,
  updateDoc,
  deleteDoc,
  getDocs,
  getDoc,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Investment, InvestmentFormData } from '@/types';
import { toTimestamp } from '@/utils/dates';
import { deleteTransaction, updateTransaction } from './transactions';

const invCol = (uid: string) => collection(db, 'users', uid, 'investments');
const invDoc = (uid: string, id: string) => doc(db, 'users', uid, 'investments', id);
const txCol = (uid: string) => collection(db, 'users', uid, 'transactions');
const accDoc = (uid: string, id: string) => doc(db, 'users', uid, 'accounts', id);

export async function getInvestments(uid: string): Promise<Investment[]> {
  const snap = await getDocs(query(invCol(uid), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Investment[];
}

/**
 * Creates the investment AND a linked 'investment' transaction that debits the
 * chosen account, so dashboard totals and account balances stay consistent.
 */
export async function addInvestment(
  uid: string,
  data: InvestmentFormData & { accountName?: string }
): Promise<string> {
  const invRef = doc(invCol(uid));
  const txRef = doc(txCol(uid));
  const date = toTimestamp(data.date);

  await runTransaction(db, async (tx) => {
    const accSnap = await tx.get(accDoc(uid, data.accountId));
    if (!accSnap.exists()) throw new Error('Account not found');
    const balance: number = accSnap.data().currentBalance ?? 0;

    tx.set(invRef, {
      ...data,
      date,
      transactionId: txRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.set(txRef, {
      type: 'investment',
      amount: data.amountInvested,
      categoryName: 'Investment',
      categoryIcon: '📈',
      categoryColor: '#6366f1',
      merchant: data.name,
      description: data.notes,
      accountId: data.accountId,
      accountName: data.accountName,
      date,
      investmentId: invRef.id,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    tx.update(accDoc(uid, data.accountId), {
      currentBalance: Math.round((balance - data.amountInvested) * 100) / 100,
      updatedAt: serverTimestamp(),
    });
  });

  return invRef.id;
}

export async function updateInvestment(
  uid: string,
  id: string,
  data: Partial<InvestmentFormData> & { accountName?: string }
): Promise<void> {
  const snap = await getDoc(invDoc(uid, id));
  if (!snap.exists()) throw new Error('Investment not found');
  const old = snap.data() as Investment;

  const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };
  if (data.date) updates.date = toTimestamp(data.date);
  await updateDoc(invDoc(uid, id), updates);

  // keep the linked transaction (and therefore account balances) in sync
  if (old.transactionId) {
    const txUpdates: Record<string, unknown> = {};
    if (data.amountInvested !== undefined) txUpdates.amount = data.amountInvested;
    if (data.accountId !== undefined) {
      txUpdates.accountId = data.accountId;
      txUpdates.accountName = data.accountName;
    }
    if (data.name !== undefined) txUpdates.merchant = data.name;
    if (data.date) txUpdates.date = toTimestamp(data.date);
    if (Object.keys(txUpdates).length) {
      try {
        await updateTransaction(uid, old.transactionId, txUpdates);
      } catch {
        // linked transaction was removed manually; nothing to sync
      }
    }
  }
}

export async function deleteInvestment(uid: string, id: string): Promise<void> {
  const snap = await getDoc(invDoc(uid, id));
  if (!snap.exists()) return;
  const inv = snap.data() as Investment;

  // refund the account by removing the linked transaction
  if (inv.transactionId) await deleteTransaction(uid, inv.transactionId);

  await deleteDoc(invDoc(uid, id));
}
