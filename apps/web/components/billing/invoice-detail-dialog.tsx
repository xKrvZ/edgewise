'use client';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { formatDate } from '@/lib/format';
import type { InvoiceRow } from '@/lib/types/billing';
import { Download, ExternalLink } from 'lucide-react';

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

function formatStatusLabel(status: string): string {
  return status.replace(/_/g, ' ');
}

interface InvoiceDetailDialogProps {
  invoice: InvoiceRow | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onRefund?: () => void;
}

export function InvoiceDetailDialog({
  invoice,
  open,
  onOpenChange,
  onRefund,
}: InvoiceDetailDialogProps) {
  if (!invoice) {
    return null;
  }

  const pdfUrl = invoice.invoiceUrl;
  const title = invoice.invoiceNumber ? `Invoice ${invoice.invoiceNumber}` : 'Invoice details';

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex max-h-[min(90vh,52rem)] flex-col gap-0 overflow-hidden p-0 sm:max-w-5xl">
        <DialogHeader className="shrink-0 border-b border-slate-100 px-6 py-5 text-left">
          <div className="flex flex-wrap items-start justify-between gap-3 pr-8">
            <div className="space-y-1">
              <DialogTitle className="text-xl font-semibold text-slate-900">{title}</DialogTitle>
              <DialogDescription className="text-sm text-slate-500">
                Issued {formatDate(invoice.createdAt)}
              </DialogDescription>
            </div>
            <Badge variant={statusVariant(invoice.status)} className="capitalize">
              {formatStatusLabel(invoice.status)}
            </Badge>
          </div>
        </DialogHeader>

        <div className="min-h-0 flex-1 overflow-y-auto px-6 py-5">
          <dl className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">Amount</dt>
              <dd className="mt-1 text-lg font-semibold text-slate-900">
                {formatAmount(invoice.amount, invoice.currency)}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                Invoice number
              </dt>
              <dd className="mt-1 font-mono text-sm text-slate-900">
                {invoice.invoiceNumber ?? '—'}
              </dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">Date</dt>
              <dd className="mt-1 text-sm text-slate-900">{formatDate(invoice.createdAt)}</dd>
            </div>
            <div className="rounded-xl border border-slate-100 bg-slate-50/80 px-4 py-3">
              <dt className="text-xs font-bold tracking-widest text-slate-500 uppercase">Status</dt>
              <dd className="mt-1 capitalize text-sm text-slate-900">
                {formatStatusLabel(invoice.status)}
              </dd>
            </div>
          </dl>

          <div className="mt-6 space-y-3">
            <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase">Total</h4>
            <div className="flex items-center justify-between rounded-xl border border-slate-100 px-4 py-3">
              <span className="text-sm text-slate-600">Amount due</span>
              <span className="text-base font-semibold text-slate-900">
                {formatAmount(invoice.amount, invoice.currency)}
              </span>
            </div>
          </div>

          {pdfUrl ? (
            <div className="mt-6 space-y-3">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <h4 className="text-xs font-bold tracking-widest text-slate-500 uppercase">
                  Invoice PDF
                </h4>
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={pdfUrl} target="_blank" rel="noreferrer">
                      <ExternalLink className="h-4 w-4" />
                      Open in new tab
                    </a>
                  </Button>
                  <Button type="button" variant="outline" size="sm" asChild>
                    <a href={pdfUrl} download>
                      <Download className="h-4 w-4" />
                      Download PDF
                    </a>
                  </Button>
                </div>
              </div>
              <div className="overflow-hidden rounded-xl border border-slate-200 bg-white">
                <iframe
                  title={`Invoice ${invoice.invoiceNumber ?? invoice.id} PDF`}
                  src={pdfUrl}
                  className="h-[min(50vh,28rem)] w-full"
                />
              </div>
            </div>
          ) : (
            <p className="mt-6 rounded-xl border border-dashed border-slate-200 bg-slate-50/50 px-4 py-3 text-sm text-slate-500">
              No PDF is available for this invoice yet. Polar generates a PDF after payment is
              processed.
            </p>
          )}
        </div>

        <DialogFooter className="shrink-0 border-t border-slate-100 px-6 py-4" showCloseButton>
          {onRefund ? (
            <Button type="button" variant="destructive" size="sm" onClick={onRefund}>
              Issue refund
            </Button>
          ) : null}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
