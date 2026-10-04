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
  increment,
  deleteField,
} from 'firebase/firestore';
import { db } from './firebase';
import { Goal, GoalFormData } from '@/types';
import { toTimestamp } from '@/utils/dates';

const goalCol = (uid: string) => collection(db, 'users', uid, 'goals');
const goalDoc = (uid: string, id: string) => doc(db, 'users', uid, 'goals', id);

export async function getGoals(uid: string): Promise<Goal[]> {
  const snap = await getDocs(query(goalCol(uid), orderBy('createdAt', 'desc')));
  return snap.docs.map((d) => ({ id: d.id, ...d.data() })) as Goal[];
}

export async function addGoal(uid: string, data: GoalFormData): Promise<string> {
  const { deadline, ...rest } = data;
  const now = serverTimestamp();
  const ref = await addDoc(goalCol(uid), {
    ...rest,
    ...(deadline ? { deadline: toTimestamp(deadline) } : {}),
    createdAt: now,
    updatedAt: now,
  });
  return ref.id;
}

export async function updateGoal(
  uid: string,
  id: string,
  data: Partial<GoalFormData>
): Promise<void> {
  const { deadline, ...rest } = data;
  await updateDoc(goalDoc(uid, id), {
    ...rest,
    ...('deadline' in data ? { deadline: deadline ? toTimestamp(deadline) : deleteField() } : {}),
    updatedAt: serverTimestamp(),
  });
}

export async function deleteGoal(uid: string, id: string): Promise<void> {
  await deleteDoc(goalDoc(uid, id));
}

export async function contributeToGoal(
  uid: string,
  id: string,
  amount: number // positive = add, negative = withdraw
): Promise<void> {
  await updateDoc(goalDoc(uid, id), {
    currentAmount: increment(amount),
    updatedAt: serverTimestamp(),
  });
}
