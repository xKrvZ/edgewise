import { Logo } from '@/components/app/logo';
import Link from 'next/link';

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fc]">
      <header className="sticky top-0 z-10 border-b border-slate-200/80 bg-white/90 px-4 py-4 backdrop-blur-sm sm:px-6 lg:px-8">
        <Link href="/" className="inline-flex">
          <Logo variant="light" />
        </Link>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white/60 px-4 py-6 text-center text-sm text-slate-500 sm:px-6 lg:px-8">
        <span className="inline-flex items-center justify-center gap-2">
          Powered by
          <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
            <Logo variant="light" className="h-7 min-w-0" />
          </Link>
        </span>
      </footer>
    </div>
  );
}
