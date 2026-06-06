import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import type { LucideIcon } from 'lucide-react';

interface PlaceholderStateProps {
  icon: LucideIcon;
  title: string;
  message: string;
}

/**
 * Foundation-phase empty/loading stub. Feature pages are built in later phases;
 * this renders a tasteful placeholder so the shell + routing are verifiable.
 */
export function PlaceholderState({ icon: Icon, title, message }: PlaceholderStateProps) {
  return (
    <Card className="border-dashed">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-16 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10 ring-1 ring-primary/20">
          <Icon className="h-6 w-6 text-primary" />
        </span>
        <div className="space-y-1.5">
          <h2 className="text-lg font-medium text-foreground">{title}</h2>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        <Badge variant="secondary" className="font-normal">
          Coming in a later phase
        </Badge>
      </CardContent>
    </Card>
  );
}
