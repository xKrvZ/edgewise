'use client';

import { PageHeader } from '@/components/app/page-header';
import { PageBody } from '@/components/shared/page-body';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Download, LineChart } from 'lucide-react';

export default function AdminReportsPage() {
  return (
    <PageBody>
      <PageHeader
        eyebrow="Administration"
        title="Finance reports"
        description="Revenue, billing, and subscription analytics."
        className="border-none pb-0"
        actions={
          <Button variant="outline" disabled>
            <Download className="h-4 w-4" />
            Export CSV
          </Button>
        }
      />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3 sm:gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-base">MRR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Monthly recurring revenue</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">ARR</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Annual run rate</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-base">Churn rate</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-semibold tabular-nums">—</p>
            <p className="mt-1 text-xs text-muted-foreground">Last 30 days</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader className="flex-row items-center justify-between">
          <CardTitle className="text-base">Revenue over time</CardTitle>
          <LineChart className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[280px] w-full" />
          <p className="mt-4 text-center text-sm text-muted-foreground">
            Revenue chart will be powered by Polar billing data — coming soon.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Transaction history</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Invoice and payment records will appear here once finance reporting is connected.
          </p>
        </CardContent>
      </Card>
    </PageBody>
  );
}
