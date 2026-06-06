import { MarketingBackgroundCanvas } from '@/components/marketing/marketing-background-canvas';
import { MarketingFooter } from '@/components/marketing/marketing-footer';
import { MarketingNav } from '@/components/marketing/marketing-nav';
import { MarketingSkipLink } from '@/components/marketing/marketing-skip-link';
import '@/components/marketing/marketing-theme.css';

interface MarketingPageShellProps {
  children: React.ReactNode;
}

export function MarketingPageShell({ children }: MarketingPageShellProps) {
  return (
    <div className="marketing min-h-screen overflow-x-hidden bg-[#f7f8fc] text-slate-950 antialiased">
      <MarketingSkipLink />
      <MarketingBackgroundCanvas />
      <MarketingNav />
      {children}
      <MarketingFooter />
    </div>
  );
}
