import { RESOURCE_ACCENT_STYLES, RESOURCE_LINKS } from '@/components/marketing/marketing-data';
import {
  MarketingSection,
  marketingSectionContentClass,
} from '@/components/marketing/marketing-section';
import { ArrowRight, BookOpen, Sparkles } from 'lucide-react';
import Link from 'next/link';

function ResourcesDotGrid() {
  return (
    <div
      className="pointer-events-none absolute -left-2 top-1/2 hidden -translate-y-1/2 sm:grid sm:grid-cols-4 sm:gap-1.5 lg:-left-6"
      aria-hidden="true"
    >
      {Array.from({ length: 16 }).map((_, index) => (
        <span key={index} className="h-1 w-1 rounded-full bg-slate-200" />
      ))}
    </div>
  );
}

function ResourcesWaveAccent() {
  return (
    <div
      className="pointer-events-none absolute -right-2 top-1/2 hidden -translate-y-1/2 items-center sm:flex lg:-right-4"
      aria-hidden="true"
    >
      <svg
        className="h-8 w-24 text-primary-foreground/70 lg:w-32"
        viewBox="0 0 128 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          d="M0 16C16 16 24 4 40 16C56 28 64 4 80 16C96 28 104 16 128 16"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
        />
      </svg>
      <Sparkles className="ml-1 h-4 w-4 text-primary" />
    </div>
  );
}

function ResourcesSectionHeader() {
  return (
    <div className="relative mx-auto max-w-2xl text-center">
      <ResourcesDotGrid />
      <ResourcesWaveAccent />

      <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-3.5 py-1.5 text-xs font-bold uppercase tracking-[0.2em] text-primary">
        <BookOpen className="h-3.5 w-3.5" aria-hidden="true" />
        Resources
      </div>

      <h2 className="mt-5 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl lg:leading-tight">
        Everything you need to{' '}
        <span className="bg-gradient-to-r from-blue-600 to-primary bg-clip-text text-transparent">
          get started
        </span>
      </h2>

      <p className="mt-4 text-base leading-7 text-slate-500 sm:text-lg sm:leading-8">
        Guides, docs, community, and support to help you journal with confidence.
      </p>
    </div>
  );
}

export function MarketingResources() {
  return (
    <MarketingSection id="resources">
      <div className="rounded-3xl border border-slate-200/80 bg-white p-8 shadow-sm lg:p-12">
        <ResourcesSectionHeader />

        <div
          className={`grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4 ${marketingSectionContentClass}`}
        >
          {RESOURCE_LINKS.map(({ icon: Icon, title, description, linkLabel, href, accent }) => {
            const styles = RESOURCE_ACCENT_STYLES[accent];

            return (
              <div
                key={title}
                className="group flex h-full flex-col rounded-xl border border-slate-200 bg-white p-6 shadow-sm transition-all hover:border-slate-300 hover:shadow-md"
              >
                <div
                  className={`mb-5 grid h-12 w-12 place-items-center rounded-xl ${styles.icon}`}
                >
                  <Icon className="h-5 w-5" aria-hidden="true" />
                </div>

                <h3 className="font-bold text-slate-950">{title}</h3>
                <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{description}</p>

                <Link
                  href={href}
                  className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
                >
                  {linkLabel}
                  <ArrowRight
                    className="h-4 w-4 transition-transform group-hover:translate-x-0.5"
                    aria-hidden="true"
                  />
                </Link>
              </div>
            );
          })}
        </div>
      </div>
    </MarketingSection>
  );
}
