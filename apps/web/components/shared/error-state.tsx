import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface ErrorStateProps {
  title?: string;
  message?: string;
  onRetry?: () => void;
}

export function ErrorState({
  title = 'Something went wrong',
  message = "We couldn't load this data. The backend may still be warming up.",
  onRetry,
}: ErrorStateProps) {
  return (
    <Card className="border-destructive/30">
      <CardContent className="flex flex-col items-center justify-center gap-4 py-12 text-center">
        <span className="flex h-12 w-12 items-center justify-center rounded-xl bg-destructive/10 ring-1 ring-destructive/20">
          <AlertTriangle className="h-6 w-6 text-destructive" />
        </span>
        <div className="space-y-1.5">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          <p className="mx-auto max-w-md text-sm text-muted-foreground">{message}</p>
        </div>
        {onRetry && (
          <Button variant="outline" size="sm" onClick={onRetry}>
            <RefreshCw className="h-4 w-4" />
            Try again
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
