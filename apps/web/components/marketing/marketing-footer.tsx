import { Logo } from '@/components/app/logo';
import { FOOTER_COLUMNS } from '@/components/marketing/marketing-data';
import { marketingContainerClass } from '@/components/marketing/marketing-section';
import Link from 'next/link';

export function MarketingFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="relative z-10 border-t border-slate-800 bg-slate-950">
      <div className={`py-16 md:py-20 ${marketingContainerClass}`}>
        <div className="grid gap-12 lg:grid-cols-[1.3fr_2fr] lg:gap-16">
          <div className="space-y-5">
            <Link href="/" className="inline-flex">
              <Logo variant="dark" className="h-9 min-w-0" />
            </Link>
            <p className="max-w-xs text-sm leading-relaxed text-slate-400">
              Trade journal software with replay, AI trade review, and trading analytics — built for
              futures, forex, and prop firm day traders.
            </p>
            <Link
              href="/sign-in"
              className="inline-flex items-center text-sm font-semibold text-primary transition-colors hover:text-primary/80"
            >
              Get started →
            </Link>
          </div>

          <div className="grid grid-cols-2 gap-x-8 gap-y-10 sm:grid-cols-3 sm:gap-x-10">
            {FOOTER_COLUMNS.map(({ title, links }) => (
              <nav key={title} aria-label={title}>
                <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
                  {title}
                </h3>
                <ul className="mt-5 space-y-3.5">
                  {links.map(({ label, href }) => (
                    <li key={label}>
                      <Link
                        href={href}
                        className="text-sm text-slate-400 transition-colors hover:text-primary"
                      >
                        {label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </nav>
            ))}
          </div>
        </div>

        <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-slate-800 pt-8 text-xs text-slate-500 sm:flex-row">
          <p>© {year} Edgewise. All rights reserved.</p>
          <div className="flex gap-6">
            <a href="#" className="transition-colors hover:text-white">
              Twitter
            </a>
            <a href="#" className="transition-colors hover:text-white">
              Discord
            </a>
            <a href="#" className="transition-colors hover:text-white">
              GitHub
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
