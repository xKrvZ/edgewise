'use client';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Stepper } from '@/components/ui/stepper';
import { api } from '@/lib/api-client';
import { type ParsedCsv, parseCsvToRecords } from '@/lib/csv';
import { useReferenceData } from '@/lib/hooks/use-reference-data';
import type { CreateTradeInput, MarketType, TradeDirection } from '@/lib/types';
import { FileUp, Upload } from 'lucide-react';
import { useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

/** Target fields the importer can map to. */
const FIELDS = [
  { key: 'symbol', label: 'Symbol', required: true },
  { key: 'direction', label: 'Direction (long/short)', required: true },
  { key: 'entryPrice', label: 'Entry price', required: true },
  { key: 'exitPrice', label: 'Exit price', required: false },
  { key: 'quantity', label: 'Quantity', required: true },
  { key: 'entryTime', label: 'Entry time', required: true },
  { key: 'exitTime', label: 'Exit time', required: false },
  { key: 'stopLoss', label: 'Stop loss', required: false },
  { key: 'takeProfit', label: 'Take profit', required: false },
  { key: 'fees', label: 'Fees', required: false },
  { key: 'notes', label: 'Notes', required: false },
] as const;

type FieldKey = (typeof FIELDS)[number]['key'];

const SKIP = '__skip__';

/** Best-effort auto-mapping from a header name to a target field. */
function guessField(header: string): FieldKey | undefined {
  const h = header.toLowerCase().replace(/[^a-z]/g, '');
  const table: Record<string, FieldKey> = {
    symbol: 'symbol',
    ticker: 'symbol',
    instrument: 'symbol',
    side: 'direction',
    direction: 'direction',
    entryprice: 'entryPrice',
    entry: 'entryPrice',
    buyprice: 'entryPrice',
    exitprice: 'exitPrice',
    exit: 'exitPrice',
    sellprice: 'exitPrice',
    qty: 'quantity',
    quantity: 'quantity',
    size: 'quantity',
    shares: 'quantity',
    contracts: 'quantity',
    entrytime: 'entryTime',
    entrydate: 'entryTime',
    opened: 'entryTime',
    opentime: 'entryTime',
    exittime: 'exitTime',
    exitdate: 'exitTime',
    closed: 'exitTime',
    closetime: 'exitTime',
    stop: 'stopLoss',
    stoploss: 'stopLoss',
    sl: 'stopLoss',
    target: 'takeProfit',
    takeprofit: 'takeProfit',
    tp: 'takeProfit',
    fee: 'fees',
    fees: 'fees',
    commission: 'fees',
    notes: 'notes',
    comment: 'notes',
  };
  return table[h];
}

function parseDirection(v: string): TradeDirection {
  const s = v.toLowerCase();
  if (s.startsWith('s') || s.includes('sell') || s.includes('short')) return 'short';
  return 'long';
}

interface CsvImportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  defaultAccountId?: string | null;
  onImported?: () => void;
}

export function CsvImportDialog({
  open,
  onOpenChange,
  defaultAccountId,
  onImported,
}: CsvImportDialogProps) {
  const { accounts } = useReferenceData();
  const fileRef = useRef<HTMLInputElement>(null);
  const [parsed, setParsed] = useState<ParsedCsv | null>(null);
  const [mapping, setMapping] = useState<Record<FieldKey, string>>({} as Record<FieldKey, string>);
  const [accountId, setAccountId] = useState<string>(defaultAccountId ?? '');
  const [marketType, setMarketType] = useState<MarketType>('stocks');
  const [importing, setImporting] = useState(false);
  const [importedCount, setImportedCount] = useState(0);

  const IMPORT_STEPS = [
    { id: 'upload', label: 'Upload file' },
    { id: 'map', label: 'Map & import' },
  ];

  function handleFile(file: File) {
    const reader = new FileReader();
    reader.onload = () => {
      const result = parseCsvToRecords(String(reader.result));
      if (result.headers.length === 0) {
        toast.error('Could not read any rows from that file.');
        return;
      }
      const auto = {} as Record<FieldKey, string>;
      for (const header of result.headers) {
        const field = guessField(header);
        if (field && !auto[field]) auto[field] = header;
      }
      setParsed(result);
      setMapping(auto);
    };
    reader.readAsText(file);
  }

  const missingRequired = useMemo(
    () => FIELDS.filter((f) => f.required && !mapping[f.key]).map((f) => f.label),
    [mapping],
  );

  async function handleImport() {
    if (!parsed) return;
    if (!accountId) {
      toast.error('Choose an account to import into.');
      return;
    }
    if (missingRequired.length) {
      toast.error(`Map required fields: ${missingRequired.join(', ')}`);
      return;
    }

    setImporting(true);
    setImportedCount(0);
    let ok = 0;
    let failed = 0;

    for (const row of parsed.rows) {
      const get = (key: FieldKey) => (mapping[key] ? row[mapping[key]] : undefined);
      const symbol = get('symbol');
      const entryPrice = Number(get('entryPrice'));
      const quantity = Number(get('quantity'));
      const entryRaw = get('entryTime');
      const entryDate = entryRaw ? new Date(entryRaw) : null;

      if (
        !symbol ||
        Number.isNaN(entryPrice) ||
        Number.isNaN(quantity) ||
        !entryDate ||
        Number.isNaN(entryDate.getTime())
      ) {
        failed++;
        continue;
      }

      const exitRaw = get('exitTime');
      const exitDate = exitRaw ? new Date(exitRaw) : null;
      const payload: CreateTradeInput = {
        accountId,
        marketType,
        symbol: symbol.toUpperCase(),
        direction: parseDirection(get('direction') ?? 'long'),
        entryPrice,
        quantity,
        entryTime: entryDate.toISOString(),
        exitPrice: numOrUndef(get('exitPrice')),
        exitTime:
          exitDate && !Number.isNaN(exitDate.getTime()) ? exitDate.toISOString() : undefined,
        stopLoss: numOrUndef(get('stopLoss')),
        takeProfit: numOrUndef(get('takeProfit')),
        fees: numOrUndef(get('fees')),
        notes: get('notes') || undefined,
        status: exitRaw ? 'closed' : 'open',
      };

      try {
        await api.trades.create(payload);
        ok++;
      } catch {
        failed++;
      }
      setImportedCount((c) => c + 1);
    }

    setImporting(false);
    toast.success(
      `Imported ${ok} trade${ok === 1 ? '' : 's'}${failed ? `, ${failed} skipped` : ''}.`,
    );
    onImported?.();
    onOpenChange(false);
    setParsed(null);
    setMapping({} as Record<FieldKey, string>);
    setImportedCount(0);
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Import trades from CSV</DialogTitle>
          <DialogDescription>
            Upload a broker export, map the columns, and we&apos;ll create the trades. P&amp;L is
            computed server-side.
          </DialogDescription>
          <Stepper steps={IMPORT_STEPS} current={parsed ? 1 : 0} className="pt-2" />
        </DialogHeader>

        {!parsed ? (
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            className="flex flex-col items-center justify-center gap-3 rounded-lg border border-dashed py-12 text-sm text-muted-foreground transition-colors hover:border-primary/50 hover:bg-accent/40 hover:text-accent-foreground"
          >
            <FileUp className="h-8 w-8 text-muted-foreground" />
            Click to choose a .csv file
            <input
              ref={fileRef}
              type="file"
              accept=".csv,text/csv"
              className="hidden"
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) handleFile(file);
              }}
            />
          </button>
        ) : (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Account</Label>
                <Select value={accountId} onValueChange={setAccountId}>
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select account" />
                  </SelectTrigger>
                  <SelectContent>
                    {accounts.map((a) => (
                      <SelectItem key={a.id} value={a.id}>
                        {a.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs text-muted-foreground">Market</Label>
                <Select value={marketType} onValueChange={(v) => setMarketType(v as MarketType)}>
                  <SelectTrigger className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(['stocks', 'futures', 'forex', 'crypto', 'options'] as const).map((m) => (
                      <SelectItem key={m} value={m} className="capitalize">
                        {m}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <ScrollArea className="max-h-64 rounded-md border p-3">
              <div className="space-y-2">
                {FIELDS.map((f) => (
                  <div key={f.key} className="grid grid-cols-2 items-center gap-2">
                    <Label className="text-sm">
                      {f.label}
                      {f.required && <span className="text-destructive"> *</span>}
                    </Label>
                    <Select
                      value={mapping[f.key] ?? SKIP}
                      onValueChange={(v) =>
                        setMapping((m) => ({
                          ...m,
                          [f.key]: v === SKIP ? '' : v,
                        }))
                      }
                    >
                      <SelectTrigger size="sm" className="w-full">
                        <SelectValue placeholder="Skip" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value={SKIP}>— Skip —</SelectItem>
                        {parsed.headers.map((h) => (
                          <SelectItem key={h} value={h}>
                            {h}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                ))}
              </div>
            </ScrollArea>
            {importing ? (
              <div className="space-y-1.5">
                <Progress
                  value={parsed.rows.length ? (importedCount / parsed.rows.length) * 100 : 0}
                />
                <p className="text-xs text-muted-foreground">
                  Importing {importedCount} of {parsed.rows.length}…
                </p>
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">
                {parsed.rows.length} row{parsed.rows.length === 1 ? '' : 's'} detected.
                {missingRequired.length > 0 && (
                  <span className="text-destructive">
                    {' '}
                    Map required: {missingRequired.join(', ')}.
                  </span>
                )}
              </p>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={importing}>
            Cancel
          </Button>
          {parsed && (
            <Button
              onClick={handleImport}
              disabled={importing || !accountId || missingRequired.length > 0}
            >
              <Upload className="h-4 w-4" />
              {importing
                ? 'Importing…'
                : `Import ${parsed.rows.length} trade${parsed.rows.length === 1 ? '' : 's'}`}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function numOrUndef(v: string | undefined): number | undefined {
  if (!v || v.trim() === '') return undefined;
  const n = Number(v);
  return Number.isNaN(n) ? undefined : n;
}
