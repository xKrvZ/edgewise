'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthDevNotice } from '@/components/auth/auth-dev-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import {
  authBackLinkClassName,
  authInputClassNameNoIcon,
  authLinkClassName,
  authPrimaryButtonClassName,
} from '@/lib/auth-form-styles';
import { ArrowLeft, CheckCircle2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const emailFromQuery = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (password !== confirmPassword) {
      setError('Passwords do not match');
      return;
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters');
      return;
    }

    if (otp.length !== 6) {
      setError('Enter the 6-digit code from your email');
      return;
    }

    setLoading(true);

    const { error: resetError } = await authClient.emailOtp.resetPassword({
      email,
      otp,
      password,
    });

    setLoading(false);

    if (resetError) {
      setError(resetError.message ?? 'Something went wrong');
      return;
    }

    setSuccess(true);
  };

  if (success) {
    return (
      <AuthCard title="Password updated" description="Your password has been reset successfully.">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>

          <p className="text-sm text-slate-600">You can now sign in with your new password.</p>

          <Button
            type="button"
            className={`mt-6 ${authPrimaryButtonClassName}`}
            onClick={() => router.push('/sign-in')}
          >
            Continue to sign in
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Reset your password"
      description="Enter the 6-digit code from your email and choose a new password."
      footer={
        <p className="text-center text-sm text-slate-600">
          Didn&apos;t receive a code?{' '}
          <Link href="/forgot-password" className={authLinkClassName}>
            Request a new one
          </Link>
        </p>
      }
    >
      <AuthDevNotice />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="reset-email">Email</Label>
          <Input
            id="reset-email"
            type="email"
            placeholder="you@example.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            autoComplete="email"
            className={authInputClassNameNoIcon}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-otp">Reset code</Label>
          <Input
            id="reset-otp"
            type="text"
            inputMode="numeric"
            pattern="[0-9]{6}"
            maxLength={6}
            placeholder="123456"
            value={otp}
            onChange={(e) => setOtp(e.target.value.replace(/\D/g, '').slice(0, 6))}
            required
            autoComplete="one-time-code"
            className={`${authInputClassNameNoIcon} text-center font-mono text-lg tracking-[0.35em]`}
            aria-describedby="reset-otp-hint"
          />
          <p id="reset-otp-hint" className="text-xs text-slate-500">
            6-digit code from your email
          </p>
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-password">New password</Label>
          <Input
            id="reset-password"
            type="password"
            placeholder="At least 8 characters"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={authInputClassNameNoIcon}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="reset-confirm-password">Confirm new password</Label>
          <Input
            id="reset-confirm-password"
            type="password"
            placeholder="Repeat your password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            required
            minLength={8}
            autoComplete="new-password"
            className={authInputClassNameNoIcon}
          />
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Updating…' : 'Update password'}
        </Button>
      </form>

      <Link href="/sign-in" className={`mt-6 ${authBackLinkClassName}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </AuthCard>
  );
}
