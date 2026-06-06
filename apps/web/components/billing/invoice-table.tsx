'use client';

import { InvoiceDetailDialog } from '@/components/billing/invoice-detail-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardSectionPaddingClass } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import type { InvoiceRow } from '@/lib/types/billing';
import { ExternalLink } from 'lucide-react';
import { useState } from 'react';

function formatAmount(amount: number, currency: string): string {
  return new Intl.NumberFormat(undefined, {
    style: 'currency',
    currency: currency.toUpperCase(),
  }).format(amount / 100);
}

function statusVariant(status: string): 'success' | 'secondary' | 'warning' | 'destructive' {
  switch (status.toLowerCase()) {
    case 'paid':
      return 'success';
    case 'pending':
    case 'draft':
      return 'warning';
    case 'refunded':
    case 'canceled':
      return 'destructive';
    default:
      return 'secondary';
  }
}

interface InvoiceTableProps {
  invoices: InvoiceRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  mockHint?: string;
}

export function InvoiceTable({
  invoices,
  isLoading = false,
  emptyMessage = 'No invoices yet.',
  mockHint,
}: InvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const openInvoice = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  const handleDialogOpenChange = (open: boolean) => {
    setDialogOpen(open);
  };

  if (isLoading) {
    return (
      <p className={cn(cardSectionPaddingClass, 'py-6 text-sm text-muted-foreground')}>
        Loading invoices…
      </p>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className={cn(cardSectionPaddingClass, 'space-y-2 py-6 text-sm text-muted-foreground')}>
        <p>{emptyMessage}</p>
        {mockHint ? <p className="text-slate-500">{mockHint}</p> : null}
      </div>
    );
  }

  return (
    <>
      <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Invoice #</TableHead>
              <TableHead className="text-right">PDF</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => (
              <TableRow
                key={invoice.id}
                tabIndex={0}
                role="button"
                aria-label={`View invoice ${invoice.invoiceNumber ?? invoice.id}`}
                className="cursor-pointer transition-colors hover:bg-accent/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                onClick={() => openInvoice(invoice)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openInvoice(invoice);
                  }
                }}
              >
                <TableCell>{formatDate(invoice.createdAt)}</TableCell>
                <TableCell>{formatAmount(invoice.amount, invoice.currency)}</TableCell>
                <TableCell>
                  <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                </TableCell>
                <TableCell className="font-mono text-xs">
                  {invoice.invoiceNumber ?? '—'}
                </TableCell>
                <TableCell className="text-right">
                  {invoice.invoiceUrl ? (
                    <Button type="button" variant="outline" size="sm" asChild>
                      <a
                        href={invoice.invoiceUrl}
                        target="_blank"
                        rel="noreferrer"
                        onClick={(event) => event.stopPropagation()}
                        onKeyDown={(event) => event.stopPropagation()}
                      >
                        <ExternalLink className="h-4 w-4" />
                        Open
                      </a>
                    </Button>
                  ) : (
                    <span className="text-xs text-muted-foreground">—</span>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
      </Table>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={dialogOpen}
        onOpenChange={handleDialogOpenChange}
      />
    </>
  );
}
