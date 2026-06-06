interface DetailFieldProps {
  label: string;
  value: string;
}

export function DetailField({ label, value }: DetailFieldProps) {
  return (
    <div>
      <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-1 text-sm font-medium tabular-nums text-foreground">{value}</p>
    </div>
  );
}
