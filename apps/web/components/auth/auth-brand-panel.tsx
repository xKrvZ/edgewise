import { Logo } from '@/components/app/logo';
import { SHOW_BACKTEST_AND_REPLAY } from '@/lib/product-visibility';
import { BarChart3, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

const FEATURES = [
  {
    icon: BookOpen,
    title: 'Journal every trade',
    description: 'Screenshots, notes, and outcomes in one place',
  },
  {
    icon: Sparkles,
    title: 'AI-powered insights',
    description: 'Uncover winning patterns and blind spots',
  },
  ...(SHOW_BACKTEST_AND_REPLAY
    ? ([
        {
          icon: BarChart3,
          title: 'Replay & backtest',
          description: 'Sharpen your edge and test with confidence',
        },
      ] as const)
    : [
        {
          icon: BarChart3,
          title: 'Trading analytics',
          description: 'Track performance and spot patterns in your data',
        },
      ]),
] as const;

interface AuthBrandPanelProps {
  compact?: boolean;
}

function ChartDecoration() {
  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      <svg
        className="absolute bottom-0 right-0 h-[45%] w-full opacity-90"
        viewBox="0 0 800 220"
        preserveAspectRatio="none"
        fill="none"
      >
        <defs>
          <linearGradient id="auth-chart-glow" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="var(--auth-chart-glow-0)" />
            <stop offset="40%" stopColor="var(--auth-chart-glow-40)" />
            <stop offset="75%" stopColor="var(--auth-chart-glow-75)" />
            <stop offset="100%" stopColor="var(--auth-chart-glow-100)" />
          </linearGradient>
          <radialGradient id="auth-chart-node" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="hsl(var(--sidebar-accent-foreground) / 0.95)" />
            <stop offset="100%" stopColor="hsl(var(--sidebar-accent-foreground) / 0)" />
          </radialGradient>
        </defs>
        <path
          d="M0 180 C100 165, 160 130, 240 140 S380 95, 480 70 S620 35, 720 18 S780 8, 800 6"
          stroke="url(#auth-chart-glow)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="800" cy="6" r="5" fill="hsl(var(--sidebar-accent-foreground))" />
        <circle cx="800" cy="6" r="14" fill="url(#auth-chart-node)" opacity="0.5" />
      </svg>
    </div>
  );
}

export function AuthBrandPanel({ compact = false }: AuthBrandPanelProps) {
  return (
    <div
      className={`auth-brand-panel relative flex h-full min-h-full w-full flex-col overflow-hidden ${
        compact ? 'px-5 py-7' : 'justify-between p-10 xl:p-12'
      }`}
    >
      <ChartDecoration />

      <div className="relative z-10 shrink-0">
        <Link href="/" className="inline-flex w-fit">
          <Logo variant="dark" className="h-11 lg:h-12" />
        </Link>
      </div>

      <div
        className={`relative z-10 ${
          compact ? 'mt-5 space-y-5' : 'flex flex-1 flex-col justify-center'
        }`}
      >
        <p className="inline-flex w-fit items-center rounded-full border border-sidebar-border/50 bg-sidebar-accent/40 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em] text-sidebar-muted-foreground">
          Built for serious traders
        </p>

        <h2
          className={`font-black leading-tight tracking-tight ${
            compact ? 'text-2xl' : 'mt-4 max-w-lg text-3xl xl:text-[2.75rem] xl:leading-[1.15]'
          }`}
        >
          <span className="text-sidebar-foreground">Smarter journaling.</span>
          <br />
          <span className="text-sidebar-primary">Stronger results.</span>
        </h2>

        {!compact ? (
          <>
            <p className="mt-5 max-w-md text-base leading-7 text-sidebar-muted-foreground">
              Review every trade, uncover patterns, and build the discipline to scale your edge.
            </p>

            <ul className="mt-12 space-y-6">
              {FEATURES.map(({ icon: Icon, title, description }) => (
                <li key={title} className="flex items-start gap-4">
                  <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-sidebar-accent/60 ring-1 ring-sidebar-border">
                    <Icon className="h-[18px] w-[18px] text-sidebar-accent-foreground" aria-hidden="true" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold text-sidebar-foreground">{title}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-sidebar-muted-foreground">{description}</p>
                  </div>
                </li>
              ))}
            </ul>
          </>
        ) : null}
      </div>

      {!compact ? (
        <div className="relative z-10 shrink-0 rounded-2xl border border-sidebar-border/40 bg-sidebar-accent/30 p-5 backdrop-blur-sm">
          <p className="text-sm font-bold text-sidebar-foreground">+62% win rate</p>
          <p className="mt-3 text-sm italic leading-relaxed text-sidebar-muted-foreground">
            &ldquo;Edgewise turned my scattered notes into a system I actually follow.&rdquo;
          </p>
          <p className="mt-2 text-xs font-medium text-sidebar-primary/70">— Demo Trader, futures scalper</p>
        </div>
      ) : null}
    </div>
  );
}
