import { BLOG_POSTS } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';
import { ArrowRight } from 'lucide-react';
import Image from 'next/image';

export function MarketingBlog() {
  return (
    <MarketingSection id="blog" band>
      <div className="flex flex-col items-start justify-between gap-6 sm:flex-row sm:items-end">
        <div className="max-w-xl">
          <p className="text-xs font-bold uppercase tracking-[0.25em] text-primary">
            From the blog
          </p>
          <h2 className="mt-4 text-3xl font-black tracking-tight text-slate-950 sm:text-4xl">
            Trading insights
          </h2>
          <p className="mt-3 text-base leading-7 text-slate-500 sm:text-lg">
            Practical ideas on journaling, psychology, and building a repeatable edge.
          </p>
        </div>
        <span className="rounded-full border border-primary/20 bg-primary/5 px-3 py-1 text-xs font-bold uppercase tracking-wide text-primary">
          Coming soon
        </span>
      </div>

      <div className="mt-12 grid gap-6 md:grid-cols-3 lg:gap-8">
        {BLOG_POSTS.map(({ title, excerpt, date, category, href, coverImage }) => (
          <a
            key={title}
            href={href}
            className="group flex h-full flex-col overflow-hidden rounded-2xl border border-slate-200 bg-[#f7f8fc] shadow-sm transition-all hover:-translate-y-1 hover:border-slate-300 hover:shadow-lg"
          >
            <div className="relative aspect-[16/10] overflow-hidden bg-slate-100">
              <Image
                src={coverImage}
                alt={`Cover illustration for ${title}`}
                width={640}
                height={400}
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-primary shadow-sm backdrop-blur-sm">
                {category}
              </span>
            </div>

            <div className="flex flex-1 flex-col p-6">
              <h3 className="text-lg font-bold leading-snug text-slate-950 transition-colors group-hover:text-primary">
                {title}
              </h3>
              <p className="mt-2 flex-1 text-sm leading-6 text-slate-500">{excerpt}</p>
              <div className="mt-5 flex items-center justify-between border-t border-slate-100 pt-4 text-xs text-slate-400">
                <time dateTime={date}>{date}</time>
                <span className="inline-flex items-center gap-1 font-semibold text-primary opacity-0 transition-opacity group-hover:opacity-100">
                  Read more
                  <ArrowRight className="h-3 w-3" aria-hidden="true" />
                </span>
              </div>
            </div>
          </a>
        ))}
      </div>

      <div className="mt-8 text-center">
        <a
          href="#"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary transition-colors hover:text-primary/80"
        >
          View all posts
          <ArrowRight className="h-4 w-4" aria-hidden="true" />
        </a>
      </div>
    </MarketingSection>
  );
}
