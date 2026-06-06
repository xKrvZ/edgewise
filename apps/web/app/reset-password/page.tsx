import { AuthLayout } from '@/components/auth/auth-layout';
import { ResetPasswordForm } from '@/components/auth/reset-password-form';
import { Suspense } from 'react';

export default function ResetPasswordPage() {
  return (
    <AuthLayout>
      <Suspense>
        <ResetPasswordForm />
      </Suspense>
    </AuthLayout>
  );
}
