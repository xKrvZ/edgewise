import { AuthLayout } from '@/components/auth/auth-layout';
import { SignInForm } from '@/components/auth/sign-in-form';
import { Suspense } from 'react';

export default function SignInPage() {
  return (
    <AuthLayout>
      <Suspense>
        <SignInForm />
      </Suspense>
    </AuthLayout>
  );
}
