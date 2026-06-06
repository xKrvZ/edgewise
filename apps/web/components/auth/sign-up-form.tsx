'use client';

import { AuthCard } from '@/components/auth/auth-card';
import { AuthDevNotice } from '@/components/auth/auth-dev-notice';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { signUp } from '@/lib/auth-client';
import { resolvePostAuthRedirect } from '@/lib/auth-utils';
import {
  authInputClassNameNoIcon,
  authLinkClassName,
  authPrimaryButtonClassName,
} from '@/lib/auth-form-styles';
import Link from 'next/link';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState } from 'react';

export function SignUpForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get('callbackUrl');
  const postAuthRedirect = resolvePostAuthRedirect(callbackUrl);

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

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

    if (!acceptedTerms) {
      setError('Please accept the terms to continue');
      return;
    }

    setLoading(true);

    const { error: signUpError } = await signUp.email({
      email,
      password,
      name,
      callbackURL: postAuthRedirect,
    });

    setLoading(false);

    if (signUpError) {
      setError(signUpError.message ?? 'Something went wrong');
      return;
    }

    router.push(`/verify-email?email=${encodeURIComponent(email)}`);
  };

  const signInHref = callbackUrl
    ? `/sign-in?callbackUrl=${encodeURIComponent(callbackUrl)}`
    : '/sign-in';

  return (
    <AuthCard
      title="Create your account"
      description="Start logging trades and building your edge — free forever."
      footer={
        <p className="text-center text-sm text-slate-600">
          Already have an account?{' '}
          <Link
            href={signInHref}
            className={authLinkClassName}
          >
            Sign in
          </Link>
        </p>
      }
    >
      <AuthDevNotice />

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        <div className="space-y-2">
          <Label htmlFor="sign-up-name">Full name</Label>
          <Input
            id="sign-up-name"
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            autoComplete="name"
            className={authInputClassNameNoIcon}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="sign-up-email">Email</Label>
          <Input
            id="sign-up-email"
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
          <Label htmlFor="sign-up-password">Password</Label>
          <Input
            id="sign-up-password"
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
          <Label htmlFor="sign-up-confirm-password">Confirm password</Label>
          <Input
            id="sign-up-confirm-password"
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

        <div className="flex items-start gap-2.5">
          <Checkbox
            id="sign-up-terms"
            checked={acceptedTerms}
            onCheckedChange={(checked) => setAcceptedTerms(checked === true)}
            className="mt-0.5"
            aria-required
          />
          <Label htmlFor="sign-up-terms" className="cursor-pointer text-sm font-normal leading-relaxed text-slate-600">
            I agree to the{' '}
            <Link href="/" className="font-medium text-primary hover:text-primary/80">
              Terms of Service
            </Link>{' '}
            and{' '}
            <Link href="/" className="font-medium text-primary hover:text-primary/80">
              Privacy Policy
            </Link>
          </Label>
        </div>

        {error ? (
          <p role="alert" className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700">
            {error}
          </p>
        ) : null}

        <Button
          type="submit"
          disabled={loading}
          className={authPrimaryButtonClassName}
        >
          {loading ? 'Creating account…' : 'Create account'}
        </Button>
      </form>
    </AuthCard>
  );
}
