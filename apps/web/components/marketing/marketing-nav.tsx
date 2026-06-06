'use client';

import { NAV_LINKS } from '@/components/marketing/marketing-data';
import { marketingContainerClass } from '@/components/marketing/marketing-section';
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Logo } from '@/components/app/logo';
import { ArrowRight, Menu } from 'lucide-react';
import Link from 'next/link';

export function MarketingNav() {
  return (
    <header className="sticky top-0 z-50 border-b border-slate-200/70 bg-white/80 backdrop-blur-xl supports-[backdrop-filter]:bg-white/70">
      <div className={`flex items-center justify-between gap-4 py-3.5 sm:py-4 ${marketingContainerClass}`}>
        <Link href="/" className="shrink-0">
          <Logo variant="light" />
        </Link>

        <nav
          className="hidden items-center gap-8 text-sm font-medium text-slate-700 lg:flex xl:gap-10"
          aria-label="Main"
        >
          {NAV_LINKS.map(({ label, href }) => (
            <Link
              key={href}
              href={href}
              className="rounded-md px-1 py-0.5 transition-colors hover:text-slate-950"
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="hidden items-center gap-3 text-sm font-semibold sm:gap-4 md:flex">
          <Link
            href="/sign-in"
            className="rounded-lg px-3 py-2 text-slate-700 transition-colors hover:bg-slate-100 hover:text-slate-950"
          >
            Sign in
          </Link>
          <Link
            href="/sign-in"
            className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-5 py-2.5 text-white shadow-lg shadow-primary/25 transition-all hover:-translate-y-0.5 hover:bg-primary/90 hover:shadow-xl hover:shadow-primary/30"
          >
            Start for free
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </Link>
        </div>

        <Sheet>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent side="right" className="w-full max-w-sm">
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo variant="light" />
              </SheetTitle>
            </SheetHeader>
            <nav className="mt-8 flex flex-col gap-1" aria-label="Mobile">
              {NAV_LINKS.map(({ label, href }) => (
                <SheetClose key={href} asChild>
                  <Link
                    href={href}
                    className="rounded-xl px-4 py-3 text-base font-medium text-slate-700 transition-colors hover:bg-slate-100"
                  >
                    {label}
                  </Link>
                </SheetClose>
              ))}
            </nav>
            <div className="mt-8 flex flex-col gap-3 border-t border-slate-200 pt-8">
              <SheetClose asChild>
                <Link
                  href="/sign-in"
                  className="rounded-xl border border-slate-200 px-4 py-3 text-center text-sm font-semibold text-slate-700 transition-colors hover:bg-slate-50"
                >
                  Sign in
                </Link>
              </SheetClose>
              <SheetClose asChild>
                <Link
                  href="/sign-in"
                  className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-3.5 text-sm font-semibold text-white shadow-lg shadow-primary/25"
                >
                  Start for free
                  <ArrowRight className="h-4 w-4" aria-hidden="true" />
                </Link>
              </SheetClose>
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
