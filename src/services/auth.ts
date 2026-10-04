import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  updatePassword,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateProfile,
  deleteUser,
  User,
} from 'firebase/auth';
import {
  doc,
  collection,
  setDoc,
  getDoc,
  getDocs,
  addDoc,
  deleteDoc,
  writeBatch,
  serverTimestamp,
} from 'firebase/firestore';
import { ref, listAll, deleteObject } from 'firebase/storage';
import { auth, db, storage } from './firebase';
import { UserProfile } from '@/types';

// ─── Friendly error messages ──────────────────────────────────────────────────

export function getAuthErrorMessage(error: unknown): string {
  const code = (error as { code?: string })?.code ?? '';
  const map: Record<string, string> = {
    'auth/invalid-credential': 'Incorrect email or password.',
    'auth/wrong-password': 'Incorrect email or password.',
    'auth/user-not-found': 'Incorrect email or password.',
    'auth/invalid-email': 'Please enter a valid email address.',
    'auth/email-already-in-use': 'An account with this email already exists.',
    'auth/weak-password': 'Password is too weak. Use at least 6 characters.',
    'auth/too-many-requests': 'Too many attempts. Please wait a moment and try again.',
    'auth/network-request-failed': 'Network error. Check your connection and try again.',
    'auth/requires-recent-login': 'Please sign in again and retry.',
    'auth/user-disabled': 'This account has been disabled.',
  };
  return map[code] ?? (error as Error)?.message ?? 'Something went wrong. Please try again.';
}

// ─── Register ─────────────────────────────────────────────────────────────────

export async function registerUser(email: string, password: string, name: string): Promise<User> {
  const credential = await createUserWithEmailAndPassword(auth, email, password);
  const user = credential.user;

  await updateProfile(user, { displayName: name });

  await setDoc(doc(db, 'users', user.uid), {
    name,
    email,
    currency: 'INR',
    theme: 'system',
    notifications: {
      budgetWarnings: true,
      recurringReminders: true,
      goalReminders: true,
    },
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  // Give every new user a starter account so they can add transactions right away.
  await addDoc(collection(db, 'users', user.uid, 'accounts'), {
    name: 'Cash',
    type: 'cash',
    openingBalance: 0,
    currentBalance: 0,
    currency: 'INR',
    color: '#22c55e',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return user;
}

export async function loginUser(email: string, password: string): Promise<User> {
  const credential = await signInWithEmailAndPassword(auth, email, password);
  return credential.user;
}

export async function logoutUser(): Promise<void> {
  await signOut(auth);
}

export async function resetPassword(email: string): Promise<void> {
  await sendPasswordResetEmail(auth, email);
}

export async function changePassword(currentPassword: string, newPassword: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');
  const credential = EmailAuthProvider.credential(user.email, currentPassword);
  await reauthenticateWithCredential(user, credential);
  await updatePassword(user, newPassword);
}

// ─── User Profile ─────────────────────────────────────────────────────────────

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  const snap = await getDoc(doc(db, 'users', uid));
  if (!snap.exists()) return null;
  return { id: snap.id, ...snap.data() } as UserProfile;
}

export async function updateUserProfile(
  uid: string,
  data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<void> {
  // setDoc+merge so this also works if the profile doc is missing
  await setDoc(doc(db, 'users', uid), { ...data, updatedAt: serverTimestamp() }, { merge: true });
  if (data.name && auth.currentUser) {
    await updateProfile(auth.currentUser, { displayName: data.name });
  }
}

export async function updateProfileData(
  data: Partial<Omit<UserProfile, 'id' | 'createdAt'>>
): Promise<void> {
  const user = auth.currentUser;
  if (!user) throw new Error('No authenticated user');
  await updateUserProfile(user.uid, data);
}

// ─── Delete account + all data ────────────────────────────────────────────────

const SUBCOLLECTIONS = [
  'transactions',
  'accounts',
  'budgets',
  'goals',
  'investments',
  'recurringPayments',
];

async function deleteCollection(uid: string, name: string) {
  const snap = await getDocs(collection(db, 'users', uid, name));
  for (let i = 0; i < snap.docs.length; i += 400) {
    const batch = writeBatch(db);
    snap.docs.slice(i, i + 400).forEach((d) => batch.delete(d.ref));
    await batch.commit();
  }
}

export async function deleteAccountAndData(password: string): Promise<void> {
  const user = auth.currentUser;
  if (!user || !user.email) throw new Error('No authenticated user');

  // Re-authenticate first: deleting the auth user requires a recent login.
  await reauthenticateWithCredential(user, EmailAuthProvider.credential(user.email, password));

  for (const name of SUBCOLLECTIONS) await deleteCollection(user.uid, name);

  try {
    const list = await listAll(ref(storage, `users/${user.uid}/receipts`));
    await Promise.all(list.items.map((i) => deleteObject(i)));
  } catch {
    // storage may be unused/disabled
  }

  await deleteDoc(doc(db, 'users', user.uid));
  await deleteUser(user);
}

