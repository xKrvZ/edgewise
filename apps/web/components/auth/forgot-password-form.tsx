'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthDevNotice } from '@/components/auth/auth-dev-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import {
  authBackLinkClassName,
  authIconChipLargeClassName,
  authInputClassNameNoIcon,
  authLinkClassName,
  authPrimaryButtonClassName,
} from '@/lib/auth-form-styles';
import { ArrowLeft, MailCheck } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

export function ForgotPasswordForm() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);

    const { error: resetError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'forget-password',
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message ?? 'Something went wrong');
      return;
    }

    setSent(true);
  };

  if (sent) {
    return (
      <AuthCard
        title="Check your email"
        description="If an account exists for that address, we sent a 6-digit reset code."
      >
        <div className="flex flex-col items-center text-center">
          <div className={authIconChipLargeClassName}>
            <MailCheck className="h-7 w-7" aria-hidden="true" />
          </div>

          <p className="text-sm leading-relaxed text-slate-600">
            Enter the code on the reset page to choose a new password. Codes expire in 5 minutes.
          </p>

          <AuthDevNotice />

          <Button
            type="button"
            className={`mt-6 ${authPrimaryButtonClassName}`}
            onClick={() =>
              router.push(`/reset-password?email=${encodeURIComponent(email)}`)
            }
          >
            Enter reset code
          </Button>

          <Link href="/sign-in" className={`mt-5 ${authBackLinkClassName}`}>
            <ArrowLeft className="h-4 w-4" aria-hidden="true" />
            Back to sign in
          </Link>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Forgot password?"
      description="Enter your email and we'll send you a reset code."
      footer={
        <p className="text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link href="/sign-in" className={authLinkClassName}>
            Sign in
          </Link>
        </p>
      }
    >
      <AuthDevNotice />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="forgot-email">Email</Label>
          <Input
            id="forgot-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={authInputClassNameNoIcon}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Sending…' : 'Send reset code'}
        </Button>
      </form>
    </AuthCard>
  );
}
