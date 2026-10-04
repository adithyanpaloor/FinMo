import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth, applyTheme } from '@/contexts/AuthContext';
import { updateProfileData, changePassword, deleteAccountAndData, getAuthErrorMessage } from '@/services/auth';
import { Coins, User, Lock, Moon, Sun, Monitor, Save, Loader2, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import toast from 'react-hot-toast';

export default function Settings() {
  const navigate = useNavigate();
  const { profile, currency, setCurrency, refreshProfile } = useAuth();
  
  // Profile state
  const [name, setName] = useState(profile?.name || '');
  const [deletePassword, setDeletePassword] = useState('');
  const [showDelete, setShowDelete] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);

  // Security state
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);

  // Theme state
  const [theme, setTheme] = useState<'light' | 'dark' | 'system'>('system');

  useEffect(() => {
    setName(profile?.name || '');
  }, [profile?.name]);

  useEffect(() => {
    const savedTheme = localStorage.getItem('finmo-theme') as any;
    if (savedTheme) {
      setTheme(savedTheme);
    }
  }, []);

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return toast.error('Name cannot be empty');
    
    try {
      setIsUpdatingProfile(true);
      await updateProfileData({ name: name.trim() });
      await refreshProfile();
      toast.success('Profile updated successfully');
    } catch (error) {
      toast.error('Failed to update profile');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (newPassword.length < 8) return toast.error('New password must be at least 8 characters');
    
    try {
      setIsUpdatingPassword(true);
      await changePassword(currentPassword, newPassword);
      toast.success('Password changed successfully');
      setCurrentPassword('');
      setNewPassword('');
    } catch (error: any) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleThemeChange = (newTheme: 'light' | 'dark' | 'system') => {
    setTheme(newTheme);
    applyTheme(newTheme);
    updateProfileData({ theme: newTheme }).catch(() => {
      /* local theme is still applied */
    });
  };

  const handleCurrencyChange = async (c: string) => {
    try {
      await setCurrency(c);
      toast.success('Currency updated');
    } catch {
      toast.error('Failed to save currency');
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsDeleting(true);
      await deleteAccountAndData(deletePassword);
      toast.success('Your account has been deleted');
      navigate('/login');
    } catch (error) {
      toast.error(getAuthErrorMessage(error));
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6 pb-12">
      <div>
        <h2 className="text-2xl font-bold text-[var(--text-primary)]">Settings</h2>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Manage your account preferences and application settings
        </p>
      </div>

      <div className="grid gap-6">
        {/* Profile Settings */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-brand-50 flex items-center justify-center">
              <User className="w-5 h-5 text-brand-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Profile Information</h3>
              <p className="text-sm text-[var(--text-secondary)]">Update your account details</p>
            </div>
          </div>

          <form onSubmit={handleUpdateProfile} className="space-y-4 max-w-md">
            <div>
              <label className="label">Email Address</label>
              <input
                type="email"
                className="input bg-[var(--bg-tertiary)] cursor-not-allowed"
                value={profile?.email || ''}
                disabled
              />
              <p className="text-xs text-[var(--text-muted)] mt-1">Email cannot be changed directly.</p>
            </div>
            
            <div>
              <label className="label">Full Name</label>
              <input
                type="text"
                className="input"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingProfile || name === profile?.name}
              className="btn-primary"
            >
              {isUpdatingProfile ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Profile
            </button>
          </form>
        </section>

        {/* Preferences */}
        <section className="card p-6">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center">
              <Monitor className="w-5 h-5 text-purple-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Preferences</h3>
              <p className="text-sm text-[var(--text-secondary)]">Customize your FinMo experience</p>
            </div>
          </div>

          <div className="space-y-6 max-w-md">
            <div>
              <label className="label">Base Currency</label>
              <select 
                className="input"
                value={currency}
                onChange={(e) => handleCurrencyChange(e.target.value)}
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
                <option value="GBP">British Pound (£)</option>
              </select>
              <p className="text-xs text-[var(--text-muted)] mt-1">This sets the default currency symbol across the app.</p>
            </div>

            <div>
              <label className="label mb-2">Theme</label>
              <div className="flex p-1 bg-[var(--bg-primary)] rounded-xl border border-[var(--border)]">
                {[
                  { id: 'light', icon: Sun, label: 'Light' },
                  { id: 'dark', icon: Moon, label: 'Dark' },
                  { id: 'system', icon: Monitor, label: 'System' }
                ].map((t) => (
                  <button
                    key={t.id}
                    onClick={() => handleThemeChange(t.id as any)}
                    className={clsx(
                      "flex-1 flex items-center justify-center gap-2 py-2 text-sm font-medium rounded-lg transition-all",
                      theme === t.id
                        ? "bg-[var(--bg-secondary)] text-[var(--text-primary)] shadow-sm"
                        : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                    )}
                  >
                    <t.icon className="w-4 h-4" />
                    <span className="hidden sm:inline">{t.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* Security */}
        <section className="card p-6 border-red-200 dark:border-red-900/30">
          <div className="flex items-center gap-3 mb-6 pb-4 border-b border-[var(--border)]">
            <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-900/20 flex items-center justify-center">
              <Lock className="w-5 h-5 text-red-500" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-[var(--text-primary)]">Security</h3>
              <p className="text-sm text-[var(--text-secondary)]">Update your password</p>
            </div>
          </div>

          <form onSubmit={handleChangePassword} className="space-y-4 max-w-md">
            <div>
              <label className="label">Current Password</label>
              <input
                type="password"
                className="input"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
              />
            </div>
            
            <div>
              <label className="label">New Password</label>
              <input
                type="password"
                className="input"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                minLength={8}
                required
              />
            </div>

            <button
              type="submit"
              disabled={isUpdatingPassword || !currentPassword || !newPassword}
              className="btn-danger mt-2"
            >
              {isUpdatingPassword ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Change Password'}
            </button>
          </form>

          {/* Danger Zone */}
          <div className="mt-8 pt-6 border-t border-[var(--border)]">
            <h4 className="text-sm font-bold text-red-500 mb-2 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4" />
              Danger Zone
            </h4>
            <p className="text-sm text-[var(--text-secondary)] mb-4">
              Permanently delete your account and all associated financial data. This action cannot be undone.
            </p>
            {!showDelete ? (
              <button
                onClick={() => setShowDelete(true)}
                className="btn-secondary text-red-500 hover:bg-red-50 dark:hover:bg-red-950/30 hover:border-red-200 dark:hover:border-red-800"
              >
                Delete Account
              </button>
            ) : (
              <form onSubmit={handleDeleteAccount} className="space-y-3 max-w-md">
                <label className="label">Confirm your password to permanently delete everything</label>
                <input
                  type="password"
                  className="input"
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  required
                  autoComplete="current-password"
                />
                <div className="flex gap-3">
                  <button type="submit" disabled={isDeleting || !deletePassword} className="btn-danger">
                    {isDeleting ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Permanently delete'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => { setShowDelete(false); setDeletePassword(''); }}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
