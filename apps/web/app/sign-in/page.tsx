import { AuthLayout } from '@/components/auth/auth-layout';
import { AuthRedirectIfAuthenticated } from '@/components/auth/auth-redirect-if-authenticated';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense>
        <AuthRedirectIfAuthenticated>
          <SignInForm />
        </AuthRedirectIfAuthenticated>
      </Suspense>
    </AuthLayout>
  );
}
