import { AuthLayout } from '@/components/auth/auth-layout';
import { VerifyEmailForm } from '@/components/auth/verify-email-form';
import { Suspense } from 'react';

export default function VerifyEmailPage() {
  return (
    <AuthLayout>
      <Suspense>
        <VerifyEmailForm />
      </Suspense>
    </AuthLayout>
  );
}
