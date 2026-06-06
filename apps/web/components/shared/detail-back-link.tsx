import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

interface DetailBackLinkProps {
  href: string;
  label: string;
  className?: string;
}

export function DetailBackLink({ href, label, className }: DetailBackLinkProps) {
  return (
    <Button variant="ghost" size="sm" className={cn('-ml-2 mb-2', className)} asChild>
      <Link href={href}>
        <ArrowLeft className="h-4 w-4" />
        {label}
      </Link>
    </Button>
  );
}
