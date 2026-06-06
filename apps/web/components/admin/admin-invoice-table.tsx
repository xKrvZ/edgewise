'use client';

import { InvoiceDetailDialog } from '@/components/billing/invoice-detail-dialog';
import { ConfirmDialog } from '@/components/shared/confirm-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cardTableStatePaddingClass } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { ApiError, api } from '@/lib/api-client';
import { cn } from '@/lib/utils';
import { formatDate } from '@/lib/format';
import type { InvoiceRow } from '@/lib/types/billing';
import { ExternalLink, RotateCcw } from 'lucide-react';
import { useState } from 'react';
import { toast } from 'sonner';

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

interface AdminInvoiceTableProps {
  userId: string;
  invoices: InvoiceRow[];
  isLoading?: boolean;
  emptyMessage?: string;
  mockHint?: string;
  onInvoiceRefunded?: () => void;
}

export function AdminInvoiceTable({
  userId,
  invoices,
  isLoading = false,
  emptyMessage = 'No invoices yet.',
  mockHint,
  onInvoiceRefunded,
}: AdminInvoiceTableProps) {
  const [selectedInvoice, setSelectedInvoice] = useState<InvoiceRow | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [refundTarget, setRefundTarget] = useState<InvoiceRow | null>(null);
  const [refundDialogOpen, setRefundDialogOpen] = useState(false);
  const [refunding, setRefunding] = useState(false);

  const openInvoice = (invoice: InvoiceRow) => {
    setSelectedInvoice(invoice);
    setDialogOpen(true);
  };

  async function confirmRefund() {
    if (!refundTarget) return;
    setRefunding(true);
    try {
      await api.admin.users.refundOrder(userId, refundTarget.id);
      toast.success('Refund issued');
      onInvoiceRefunded?.();
    } catch (err) {
      toast.error(err instanceof ApiError ? err.message : 'Failed to issue refund');
      throw err;
    } finally {
      setRefunding(false);
    }
  }

  if (isLoading) {
    return (
      <p className={cn(cardTableStatePaddingClass, 'text-sm text-muted-foreground')}>
        Loading invoices…
      </p>
    );
  }

  if (invoices.length === 0) {
    return (
      <div className={cn(cardTableStatePaddingClass, 'space-y-2 text-sm text-muted-foreground')}>
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
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invoices.map((invoice) => {
              const canRefund = invoice.status.toLowerCase() === 'paid';
              return (
                <TableRow key={invoice.id}>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => openInvoice(invoice)}
                  >
                    {formatDate(invoice.createdAt)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => openInvoice(invoice)}
                  >
                    {formatAmount(invoice.amount, invoice.currency)}
                  </TableCell>
                  <TableCell
                    className="cursor-pointer"
                    onClick={() => openInvoice(invoice)}
                  >
                    <Badge variant={statusVariant(invoice.status)}>{invoice.status}</Badge>
                  </TableCell>
                  <TableCell
                    className="cursor-pointer font-mono text-xs"
                    onClick={() => openInvoice(invoice)}
                  >
                    {invoice.invoiceNumber ?? '—'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      {invoice.invoiceUrl ? (
                        <Button type="button" variant="outline" size="sm" asChild>
                          <a href={invoice.invoiceUrl} target="_blank" rel="noreferrer">
                            <ExternalLink className="h-4 w-4" />
                          </a>
                        </Button>
                      ) : null}
                      {canRefund ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setRefundTarget(invoice);
                            setRefundDialogOpen(true);
                          }}
                        >
                          <RotateCcw className="h-4 w-4" />
                          Refund
                        </Button>
                      ) : null}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
      </Table>

      <InvoiceDetailDialog
        invoice={selectedInvoice}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onRefund={
          selectedInvoice?.status.toLowerCase() === 'paid'
            ? () => {
                setRefundTarget(selectedInvoice);
                setRefundDialogOpen(true);
              }
            : undefined
        }
      />

      <ConfirmDialog
        open={refundDialogOpen}
        onOpenChange={setRefundDialogOpen}
        title="Issue refund?"
        description={
          refundTarget
            ? `Refund ${formatAmount(refundTarget.amount, refundTarget.currency)} for invoice ${refundTarget.invoiceNumber ?? refundTarget.id}. This action cannot be undone.`
            : 'Issue a full refund for this order.'
        }
        confirmLabel={refunding ? 'Refunding…' : 'Issue refund'}
        onConfirm={confirmRefund}
      />
    </>
  );
}
