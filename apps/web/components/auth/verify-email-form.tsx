'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthDevNotice } from '@/components/auth/auth-dev-notice';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { authClient } from '@/lib/auth-client';
import { resolvePostAuthRedirect } from '@/lib/auth-utils';
import {
  AnalyticsEvents,
  captureActivationMilestone,
  captureEvent,
} from '@/lib/posthog';
import {
  authBackLinkClassName,
  authIconClassName,
  authInputClassNameNoIcon,
  authLinkClassName,
  authPrimaryButtonClassName,
} from '@/lib/auth-form-styles';
import { ArrowLeft, CheckCircle2, Mail } from 'lucide-react';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';
import { toast } from 'sonner';

export function VerifyEmailForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const postAuthRedirect = resolvePostAuthRedirect(callbackUrl);
  const emailFromQuery = searchParams.get('email') ?? '';

  const [email, setEmail] = useState(emailFromQuery);
  const [otp, setOtp] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [verified, setVerified] = useState(false);

  const handleResend = async () => {
    if (!email) {
      setError('Enter your email address');
      return;
    }

    setError(null);
    setResending(true);

    const { error: resendError } = await authClient.emailOtp.sendVerificationOtp({
      email,
      type: 'email-verification',
    });

    setResending(false);

    if (resendError) {
      setError(resendError.message ?? 'Could not resend code');
      return;
    }

    toast.success('Verification code sent');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (otp.length !== 6) {
      setError('Enter the 6-digit verification code');
      return;
    }

    setLoading(true);

    const { error: verifyError } = await authClient.emailOtp.verifyEmail({
      email,
      otp,
    });

    setLoading(false);

    if (verifyError) {
      setError(verifyError.message ?? 'Invalid or expired code');
      return;
    }

    captureEvent(AnalyticsEvents.EMAIL_VERIFIED, {});

    setVerified(true);
    router.refresh();
  };

  if (verified) {
    return (
      <AuthCard title="Email verified" description="Your account is ready. Welcome to Edgewise.">
        <div className="flex flex-col items-center text-center">
          <div className="mb-5 flex h-14 w-14 items-center justify-center rounded-2xl bg-emerald-100 text-emerald-600">
            <CheckCircle2 className="h-7 w-7" aria-hidden="true" />
          </div>

          <Button
            type="button"
            className={`mt-2 ${authPrimaryButtonClassName}`}
            onClick={() => {
              captureActivationMilestone(AnalyticsEvents.ONBOARDING_COMPLETED, {
                source: 'email_verification',
              });
              router.push(postAuthRedirect);
            }}
          >
            Go to My Journal
          </Button>
        </div>
      </AuthCard>
    );
  }

  return (
    <AuthCard
      title="Verify your email"
      description="We sent a 6-digit code to your inbox. Enter it below to activate your account."
      footer={
        <p className="text-center text-sm text-slate-600">
          Wrong email?{' '}
          <Link href="/sign-up" className={authLinkClassName}>
            Sign up again
          </Link>
        </p>
      }
    >
      <AuthDevNotice />

      <div className="mb-6 flex items-center gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3">
        <Mail className={`shrink-0 ${authIconClassName}`} aria-hidden="true" />
        <p className="text-sm text-slate-600">
          Check your inbox and spam folder. Codes expire in 5 minutes.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="verify-email">Email</Label>
          <Input
            id="verify-email"
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
          <Label htmlFor="verify-otp">Verification code</Label>
          <Input
            id="verify-otp"
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
            aria-describedby="verify-otp-hint"
          />
          <p id="verify-otp-hint" className="text-xs text-slate-500">
            6-digit code from your email
          </p>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button type="submit" disabled={loading} className={authPrimaryButtonClassName}>
          {loading ? 'Verifying…' : 'Verify email'}
        </Button>

        <Button
          type="button"
          variant="outline"
          disabled={resending}
          className="h-12 w-full rounded-xl border-slate-200 bg-white font-semibold text-slate-900 shadow-none hover:border-slate-300 hover:bg-slate-50"
          onClick={handleResend}
        >
          {resending ? 'Sending…' : 'Resend code'}
        </Button>
      </form>

      <Link href="/sign-in" className={`mt-6 ${authBackLinkClassName}`}>
        <ArrowLeft className="h-4 w-4" aria-hidden="true" />
        Back to sign in
      </Link>
    </AuthCard>
  );
}
