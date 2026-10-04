import {
  collection,
  doc,
  addDoc,
  updateDoc,
  deleteDoc,
  getDocs,
  query,
  where,
  orderBy,
  serverTimestamp,
} from 'firebase/firestore';
import { db } from './firebase';
import { Budget, BudgetFormData } from '@/types';

const budCol = (uid: string) => collection(db, 'users', uid, 'budgets');
const budDoc = (uid: string, id: string) => doc(db, 'users', uid, 'budgets', id);

export async function getBudgets(uid: string): Promise<Budget[]> {
  const q = query(budCol(uid), orderBy('createdAt', 'desc'));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Budget[];
}

export async function getBudgetsForMonth(
  uid: string,
  month: number,
  year: number
): Promise<Budget[]> {
  const q = query(
    budCol(uid),
    where('month', '==', month),
    where('year', '==', year)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Budget[];
}

export async function addBudget(
  uid: string,
  data: BudgetFormData
): Promise<string> {
  const now = serverTimestamp();
  const ref = await addDoc(budCol(uid), { ...data, createdAt: now, updatedAt: now });
  return ref.id;
}

export async function updateBudget(
  uid: string,
  id: string,
  data: Partial<BudgetFormData>
): Promise<void> {
  await updateDoc(budDoc(uid, id), { ...data, updatedAt: serverTimestamp() });
}

export async function deleteBudget(uid: string, id: string): Promise<void> {
  await deleteDoc(budDoc(uid, id));
}
