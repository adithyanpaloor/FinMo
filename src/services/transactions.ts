import {
  collection,
  doc,
  updateDoc,
  getDocs,
  getDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  serverTimestamp,
  increment,
  runTransaction,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
} from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from './firebase';
import { Transaction } from '@/types';

const txCol = (uid: string) => collection(db, 'users', uid, 'transactions');
const txDoc = (uid: string, id: string) => doc(db, 'users', uid, 'transactions', id);
const accDoc = (uid: string, id: string) => doc(db, 'users', uid, 'accounts', id);

type TxCore = Pick<Transaction, 'type' | 'amount' | 'accountId' | 'toAccountId'>;

/**
 * Net effect of a transaction on each account balance.
 * Returns a map of accountId -> delta.
 */
export function balanceEffects(t: TxCore): Map<string, number> {
  const m = new Map<string, number>();
  const add = (id: string | undefined, d: number) => {
    if (!id) return;
    m.set(id, (m.get(id) ?? 0) + d);
  };
  switch (t.type) {
    case 'income':
      add(t.accountId, t.amount);
      break;
    case 'expense':
    case 'investment':
      add(t.accountId, -t.amount);
      break;
    case 'transfer':
      add(t.accountId, -t.amount);
      add(t.toAccountId, t.amount);
      break;
  }
  return m;
}

// ─── Add Transaction ──────────────────────────────────────────────────────────

export async function addTransaction(
  uid: string,
  data: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> {
  const newRef = doc(txCol(uid));
  const effects = balanceEffects(data);

  await runTransaction(db, async (tx) => {
    // Firestore requires all reads before any writes.
    const accountIds = [...effects.keys()];
    const snaps = await Promise.all(accountIds.map((id) => tx.get(accDoc(uid, id))));
    snaps.forEach((s, i) => {
      if (!s.exists()) {
        throw new Error(
          accountIds[i] === data.accountId ? 'Account not found' : 'Destination account not found'
        );
      }
    });

    tx.set(newRef, { ...data, createdAt: serverTimestamp(), updatedAt: serverTimestamp() });
    accountIds.forEach((id, i) => {
      const current: number = snaps[i].data()?.currentBalance ?? 0;
      tx.update(accDoc(uid, id), {
        currentBalance: Math.round((current + effects.get(id)!) * 100) / 100,
        updatedAt: serverTimestamp(),
      });
    });
  });

  return newRef.id;
}

// ─── Get one ──────────────────────────────────────────────────────────────────

export async function getTransactionById(uid: string, id: string): Promise<Transaction | null> {
  const snap = await getDoc(txDoc(uid, id));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as Transaction;
}

// ─── Update Transaction (re-balances accounts) ────────────────────────────────

export async function updateTransaction(
  uid: string,
  id: string,
  data: Partial<Omit<Transaction, 'id' | 'createdAt'>>
): Promise<void> {
  await runTransaction(db, async (tx) => {
    const oldSnap = await tx.get(txDoc(uid, id));
    if (!oldSnap.exists()) throw new Error('Transaction not found');
    const old = oldSnap.data() as Transaction;
    const next = { ...old, ...data } as Transaction;

    // net balance change = effects(new) - effects(old)
    const net = new Map<string, number>();
    balanceEffects(old).forEach((d, k) => net.set(k, (net.get(k) ?? 0) - d));
    balanceEffects(next).forEach((d, k) => net.set(k, (net.get(k) ?? 0) + d));

    const ids = [...net.entries()].filter(([, d]) => d !== 0).map(([k]) => k);
    const snaps = await Promise.all(ids.map((k) => tx.get(accDoc(uid, k))));

    ids.forEach((k, i) => {
      if (!snaps[i].exists()) return;
      const current: number = snaps[i].data()?.currentBalance ?? 0;
      tx.update(accDoc(uid, k), {
        currentBalance: Math.round((current + net.get(k)!) * 100) / 100,
        updatedAt: serverTimestamp(),
      });
    });

    tx.update(txDoc(uid, id), { ...data, updatedAt: serverTimestamp() });
  });
}

// ─── Delete Transaction ───────────────────────────────────────────────────────

export async function deleteTransaction(uid: string, transactionId: string): Promise<void> {
  let receiptUrl: string | undefined;

  await runTransaction(db, async (tx) => {
    const snap = await tx.get(txDoc(uid, transactionId));
    if (!snap.exists()) return;
    const t = snap.data() as Transaction;
    receiptUrl = t.receiptUrl;

    const effects = balanceEffects(t);
    const ids = [...effects.keys()];
    const snaps = await Promise.all(ids.map((k) => tx.get(accDoc(uid, k))));

    ids.forEach((k, i) => {
      if (!snaps[i].exists()) return;
      const current: number = snaps[i].data()?.currentBalance ?? 0;
      tx.update(accDoc(uid, k), {
        currentBalance: Math.round((current - effects.get(k)!) * 100) / 100,
        updatedAt: serverTimestamp(),
      });
    });

    tx.delete(txDoc(uid, transactionId));
  });

  if (receiptUrl) {
    try {
      await deleteObject(ref(storage, receiptUrl));
    } catch {
      // ignore storage cleanup errors
    }
  }
}

// ─── Get Transactions ─────────────────────────────────────────────────────────

export async function getTransactions(
  uid: string,
  options: {
    startDate?: Date;
    endDate?: Date;
    limitCount?: number;
    lastDoc?: QueryDocumentSnapshot<DocumentData>;
  } = {}
): Promise<{
  transactions: Transaction[];
  lastDoc: QueryDocumentSnapshot<DocumentData> | null;
  hasMore: boolean;
}> {
  const { startDate, endDate, limitCount = 50, lastDoc: cursor } = options;

  const constraints = [];
  if (startDate) constraints.push(where('date', '>=', Timestamp.fromDate(startDate)));
  if (endDate) constraints.push(where('date', '<=', Timestamp.fromDate(endDate)));
  constraints.push(orderBy('date', 'desc'));
  if (cursor) constraints.push(startAfter(cursor));
  constraints.push(limit(limitCount));

  const snap = await getDocs(query(txCol(uid), ...constraints));
  const transactions = snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];

  return {
    transactions,
    lastDoc: snap.docs[snap.docs.length - 1] ?? null,
    hasMore: snap.docs.length === limitCount,
  };
}

export async function getTransactionsByDateRange(
  uid: string,
  start: Date,
  end: Date
): Promise<Transaction[]> {
  const q = query(
    txCol(uid),
    where('date', '>=', Timestamp.fromDate(start)),
    where('date', '<=', Timestamp.fromDate(end)),
    orderBy('date', 'desc')
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
}

export async function getRecentTransactions(uid: string, count = 10): Promise<Transaction[]> {
  const q = query(txCol(uid), orderBy('date', 'desc'), limit(count));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
}

// ─── Receipt Upload ───────────────────────────────────────────────────────────

export async function uploadReceipt(
  uid: string,
  transactionId: string,
  file: File
): Promise<string> {
  if (file.size > 5 * 1024 * 1024) throw new Error('File size must be less than 5MB');

  const ext = file.name.split('.').pop()?.toLowerCase();
  const allowed = ['jpg', 'jpeg', 'png', 'webp', 'pdf'];
  if (!ext || !allowed.includes(ext)) throw new Error('Unsupported file type');

  const storageRef = ref(storage, `users/${uid}/receipts/${transactionId}.${ext}`);
  await uploadBytes(storageRef, file);
  const url = await getDownloadURL(storageRef);
  await updateDoc(txDoc(uid, transactionId), { receiptUrl: url });
  return url;
}

// ─── Batch Import (adjusts account balances too) ──────────────────────────────

export async function importTransactions(
  uid: string,
  transactions: Omit<Transaction, 'id' | 'createdAt' | 'updatedAt'>[]
): Promise<number> {
  const CHUNK = 200;
  for (let i = 0; i < transactions.length; i += CHUNK) {
    const slice = transactions.slice(i, i + CHUNK);
    const batch = writeBatch(db);
    const deltas = new Map<string, number>();

    for (const t of slice) {
      batch.set(doc(txCol(uid)), {
        ...t,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      });
      balanceEffects(t).forEach((d, k) => deltas.set(k, (deltas.get(k) ?? 0) + d));
    }
    deltas.forEach((d, k) => {
      batch.update(accDoc(uid, k), { currentBalance: increment(d), updatedAt: serverTimestamp() });
    });
    await batch.commit();
  }
  return transactions.length;
}

// ─── All Transactions (for export) ───────────────────────────────────────────

export async function getAllTransactions(uid: string): Promise<Transaction[]> {
  const snap = await getDocs(query(txCol(uid), orderBy('date', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Transaction[];
}
