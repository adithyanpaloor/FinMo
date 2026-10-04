import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged } from 'firebase/auth';
import { useQueryClient } from '@tanstack/react-query';
import { auth } from '@/services/firebase';
import { getUserProfile, updateProfileData } from '@/services/auth';
import { UserProfile } from '@/types';

interface AuthContextValue {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  currency: string;
  setCurrency: (currency: string) => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextValue | null>(null);

export function applyTheme(theme: 'light' | 'dark' | 'system') {
  const root = document.documentElement;
  const dark =
    theme === 'dark' ||
    (theme === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
  root.classList.toggle('dark', dark);
  localStorage.setItem('finmo-theme', theme);
}

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const qc = useQueryClient();
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [currencyOverride, setCurrencyOverride] = useState<string | null>(null);

  const loadProfile = useCallback(async (u: User) => {
    try {
      const p = await getUserProfile(u.uid);
      setProfile(p);
      if (p?.theme) applyTheme(p.theme);
      if (p?.currency) setCurrencyOverride(null);
    } catch {
      // profile load failure is non-fatal
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    if (auth.currentUser) await loadProfile(auth.currentUser);
  }, [loadProfile]);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      if (firebaseUser) {
        await loadProfile(firebaseUser);
      } else {
        setProfile(null);
        setCurrencyOverride(null);
        qc.clear(); // never leak one user's cached data to the next
      }
      setLoading(false);
    });
    return unsubscribe;
  }, [loadProfile, qc]);

  // Follow OS theme changes when theme is "system"
  useEffect(() => {
    const mq = window.matchMedia('(prefers-color-scheme: dark)');
    const onChange = () => {
      if ((localStorage.getItem('finmo-theme') ?? 'system') === 'system') applyTheme('system');
    };
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  const currency = currencyOverride ?? profile?.currency ?? 'INR';

  const setCurrency = async (c: string) => {
    setCurrencyOverride(c); // instant UI update
    await updateProfileData({ currency: c }); // persist
  };

  // If the profile doc hasn't been created yet (right after sign-up), fall back to auth data.
  const effectiveProfile: UserProfile | null =
    profile ??
    (user
      ? ({
          id: user.uid,
          name: user.displayName ?? '',
          email: user.email ?? '',
          currency: 'INR',
          theme: 'system',
          notifications: { budgetWarnings: true, recurringReminders: true, goalReminders: true },
        } as unknown as UserProfile)
      : null);

  return (
    <AuthContext.Provider
      value={{ user, profile: effectiveProfile, loading, currency, setCurrency, refreshProfile }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used within AuthProvider');
  return ctx;
}
