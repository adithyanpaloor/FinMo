import {
  collection,
  doc,
  addDoc,
  deleteDoc,
  getDocs,
  query,
  orderBy,
  runTransaction,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Account, AccountFormData } from '@/types';

const accCol = (uid: string) => collection(db, 'users', uid, 'accounts');
const accDoc = (uid: string, id: string) => doc(db, 'users', uid, 'accounts', id);

export async function getAccounts(uid: string): Promise<Account[]> {
  const snap = await getDocs(query(accCol(uid), orderBy('createdAt', 'asc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Account[];
}

export async function addAccount(uid: string, data: AccountFormData): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(accCol(uid), {
    ...data,
    currentBalance: data.openingBalance,
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateAccount(
  uid: string,
  id: string,
  data: Partial<AccountFormData>
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const snap = await tx.get(accDoc(uid, id));
    if (!snap.exists()) throw new Error('Account not found');
    const updates: Record<string, unknown> = { ...data, updatedAt: serverTimestamp() };

    // If the opening balance changed, shift the current balance by the same amount.
    if (typeof data.openingBalance === 'number') {
      const oldOpening: number = snap.data().openingBalance ?? 0;
      const current: number = snap.data().currentBalance ?? 0;
      updates.currentBalance =
        Math.round((current + (data.openingBalance - oldOpening)) * 100) / 100;
    }
    tx.update(accDoc(uid, id), updates);
  });
}

export async function deleteAccount(uid: string, id: string): Promise<void> {
  await deleteDoc(accDoc(uid, id));
}
