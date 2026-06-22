import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthRedirectIfAuthenticated } from '@/components/auth/auth-redirect-if-authenticated';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthRedirectIfAuthenticated>
          <SignUpForm />
        </AuthRedirectIfAuthenticated>
      </Suspense>
    </AuthLayout>
  );
}
