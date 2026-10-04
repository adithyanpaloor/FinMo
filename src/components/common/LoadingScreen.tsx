import { Loader2 } from 'lucide-react';

export default function LoadingScreen() {
  return (
    <div className="flex h-screen items-center justify-center bg-[var(--bg-primary)]">
      <div className="flex flex-col items-center gap-4 text-brand-500 animate-pulse">
        <Loader2 className="w-10 h-10 animate-spin" />
        <span className="text-sm font-medium">Loading FinMo...</span>
      </div>
    </div>
  );
}

export function LoadingSpinner({ className = '' }: { className?: string }) {
  return <Loader2 className={`w-5 h-5 animate-spin ${className}`} />;
}
