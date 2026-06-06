import { AuthLayout } from '@/components/auth/auth-layout';
import { SignUpForm } from '@/components/auth/sign-up-form';
import { Suspense } from 'react';

export default function SignUpPage() {
  return (
    <AuthLayout>
      <Suspense>
        <SignUpForm />
      </Suspense>
    </AuthLayout>
  );
}
