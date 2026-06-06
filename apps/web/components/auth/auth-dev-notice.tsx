import { Info } from 'lucide-react';

export function AuthDevNotice() {
  if (process.env.NODE_ENV === 'production') {
    return null;
  }

  return (
    <div
      role="status"
      className="mb-5 flex gap-2.5 rounded-xl border border-primary/20 bg-primary/5 px-3.5 py-2.5 text-xs leading-relaxed text-foreground sm:mb-6 sm:gap-3 sm:px-4 sm:py-3 sm:text-sm"
    >
      <Info className="mt-0.5 h-4 w-4 shrink-0 text-primary" aria-hidden="true" />
      <p>
        <span className="font-semibold">Dev mode:</span> verification and reset codes are logged to
        the API server console. Check your terminal for OTP emails.
      </p>
    </div>
  );
}
