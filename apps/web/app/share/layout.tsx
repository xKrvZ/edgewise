import { Logo } from '@/components/app/logo';
import { marketingContainerClass } from '@/components/marketing/marketing-section';
import { ShareNavActions } from '@/components/share/share-nav-actions';
import Link from 'next/link';

export default function ShareLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#f7f8fc]">
      <header className="sticky top-0 z-50 border-b border-slate-200/80 bg-white/90 backdrop-blur-sm">
        <div
          className={`flex items-center justify-between gap-4 py-3.5 sm:py-4 ${marketingContainerClass}`}
        >
          <Link href="/" className="inline-flex shrink-0">
            <Logo variant="light" />
          </Link>
          <ShareNavActions />
        </div>
      </header>
      <main className="relative z-0 mx-auto w-full max-w-5xl flex-1 space-y-8 px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
        {children}
      </main>
      <footer className="border-t border-slate-200/80 bg-white/60 text-center text-sm text-slate-500">
        <div className={`py-6 ${marketingContainerClass}`}>
          <span className="inline-flex items-center justify-center gap-2">
            Powered by
            <Link href="/" className="inline-flex transition-opacity hover:opacity-80">
              <Logo variant="light" className="h-7 min-w-0" />
            </Link>
          </span>
        </div>
      </footer>
    </div>
  );
}
