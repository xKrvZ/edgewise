import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { BarChart3 } from 'lucide-react';
import Image from 'next/image';

interface AdminPostHogSetupBannerProps {
  configured: boolean;
  hasError?: boolean;
}

function PostHogLogomark({ className }: { className?: string }) {
  return (
    <Image
      src="/posthog-logomark.svg"
      alt=""
      width={119}
      height={64}
      className={className}
      aria-hidden
    />
  );
}

export function AdminPostHogPoweredBadge() {
  return (
    <Badge variant="secondary" className="gap-1.5 font-normal">
      <BarChart3 className="size-3.5" aria-hidden />
      Powered by PostHog
    </Badge>
  );
}

export function AdminPostHogSetupBanner({ configured, hasError }: AdminPostHogSetupBannerProps) {
  if (configured && !hasError) {
    return null;
  }

  return (
    <Alert
      variant={hasError ? 'destructive' : 'default'}
      className="flex min-h-48 flex-col items-center justify-center gap-4 border-dashed p-10 text-center [&>svg]:static [&>svg~*]:pl-0 [&>svg+div]:translate-y-0"
    >
      <PostHogLogomark className="h-16 w-auto shrink-0" />
      <AlertTitle className="text-xl font-semibold">
        {hasError ? 'PostHog query failed' : 'PostHog not configured'}
      </AlertTitle>
      <AlertDescription className="max-w-md text-center">
        {hasError ? (
          <p>
            PostHog credentials are set but the analytics query failed. Check API logs, verify your
            personal API key has Query Read scope, and confirm the project ID matches your PostHog
            project.
          </p>
        ) : (
          <p>PostHog is not configured, so analytics cannot be displayed.</p>
        )}
      </AlertDescription>
    </Alert>
  );
}
