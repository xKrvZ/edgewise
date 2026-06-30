'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function CommunityOwnerMembershipSection() {
  return (
    <Card className="border-muted">
      <CardHeader className="pb-3">
        <CardTitle className="text-base">Membership</CardTitle>
        <CardDescription>
          As the community owner, you cannot leave while you still own this community. To step
          away, delete the community from your account settings or transfer ownership when that
          option is available.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Deleting the community removes it for all members and revokes everyone&apos;s access.
        </p>
      </CardContent>
    </Card>
  );
}
