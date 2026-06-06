import Link from 'next/link';
import { Button } from '@/components/ui/button';

export default function ShareNotFound() {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <h1 className="text-2xl font-semibold tracking-tight">Link not available</h1>
      <p className="mt-2 max-w-md text-sm text-muted-foreground">
        This shared trade or stats page does not exist, or the owner has made it private.
      </p>
      <Button asChild className="mt-6" variant="outline">
        <Link href="/">Go to Edgewise</Link>
      </Button>
    </div>
  );
}
