import { TRUSTED_FIRMS } from '@/components/marketing/marketing-data';
import { MarketingSection } from '@/components/marketing/marketing-section';
import Image from 'next/image';

export function MarketingTrustedBy() {
  return (
    <MarketingSection compact>
      <p className="mb-8 text-center text-xs font-bold uppercase tracking-[0.25em] text-slate-400">
        Trusted by traders at
      </p>
      <div className="flex flex-wrap items-center justify-center gap-8 lg:gap-12">
        {TRUSTED_FIRMS.map((firm) => (
          <Image
            key={firm.name}
            src={firm.logo}
            alt={firm.alt}
            width={firm.width}
            height={firm.height}
            unoptimized
            className="h-8 w-auto object-contain opacity-60 grayscale transition-opacity hover:opacity-100"
          />
        ))}
      </div>
    </MarketingSection>
  );
}
