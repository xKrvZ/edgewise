import { Logo } from '@/components/app/logo';
import Link from 'next/link';

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="sticky top-0 z-10 border-b border-border/60 bg-background/80 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex">
          <Logo variant="light" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-4xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <footer className="border-t border-border/60 px-4 py-6 text-center text-sm text-muted-foreground sm:px-6 lg:px-8">
        <span className="inline-flex items-center justify-center gap-2">
          Powered by
          <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
            <Logo variant="light" className="h-5" />
          </Link>
        </span>
      </footer>
    </div>
  );
}
