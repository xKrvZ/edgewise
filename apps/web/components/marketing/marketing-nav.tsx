'use client';

import { MarketingNavActions } from '@/components/marketing/marketing-nav-actions';
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
import { Menu } from 'lucide-react';
import Link from 'next/link';
import { useState } from 'react';

export function MarketingNav() {
  const [mobileOpen, setMobileOpen] = useState(false);

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

        <div className="hidden md:flex">
          <MarketingNavActions placement="desktop" />
        </div>

        <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
          <SheetTrigger asChild>
            <button
              type="button"
              className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-slate-200 bg-white text-slate-700 shadow-sm transition-colors hover:border-slate-300 hover:bg-slate-50 md:hidden"
              aria-label="Open menu"
            >
              <Menu className="h-5 w-5" />
            </button>
          </SheetTrigger>
          <SheetContent
            side="right"
            className="w-full max-w-sm border-slate-200 bg-white text-slate-950 shadow-lg [&_[data-slot=sheet-close]]:text-slate-500 [&_[data-slot=sheet-close]]:ring-offset-white [&_[data-slot=sheet-close]]:hover:bg-slate-100 [&_[data-slot=sheet-close]]:hover:text-slate-900"
          >
            <SheetHeader>
              <SheetTitle className="text-left">
                <Logo variant="light" />
              </SheetTitle>
            </SheetHeader>
            <MarketingNavActions placement="mobile" mobileSection="header" />
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
            <MarketingNavActions
              placement="mobile"
              mobileSection="footer"
              onNavigate={() => setMobileOpen(false)}
            />
          </SheetContent>
        </Sheet>
      </div>
    </header>
  );
}
