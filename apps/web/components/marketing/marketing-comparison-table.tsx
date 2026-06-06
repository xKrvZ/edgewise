import {
  COMPETITOR_COMPARISON,
  COMPETITOR_LABELS,
  type ComparisonValue,
} from '@/components/marketing/marketing-data';
import { Check, Minus, X } from 'lucide-react';

function ComparisonCell({ value }: { value: ComparisonValue }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center gap-1.5 text-emerald-700">
        <Check className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">Yes</span>
      </span>
    );
  }

  if (value === false) {
    return (
      <span className="inline-flex items-center gap-1.5 text-slate-300">
        <X className="h-4 w-4" aria-hidden="true" />
        <span className="sr-only">No</span>
      </span>
    );
  }

  const label = value === 'partial' ? 'Partial' : 'Limited';

  return (
    <span className="inline-flex items-center gap-1.5 text-amber-600">
      <Minus className="h-4 w-4" aria-hidden="true" />
      <span className="text-xs font-medium">{label}</span>
    </span>
  );
}

interface MarketingComparisonTableProps {
  showDisclaimer?: boolean;
  compact?: boolean;
}

export function MarketingComparisonTable({
  showDisclaimer = true,
  compact = false,
}: MarketingComparisonTableProps) {
  return (
    <div>
      <div className="-mx-4 overflow-x-auto rounded-none border-y border-slate-200 bg-white px-4 shadow-sm sm:mx-0 sm:rounded-3xl sm:border sm:px-0">
        <table className="w-full min-w-[36rem] border-collapse text-left text-sm">
          <caption className="sr-only">
            Feature comparison of Edgewise vs other journals, Tradervue, and Edgewonk-style journals
          </caption>
          <thead>
            <tr className="border-b border-slate-200 bg-slate-50/80">
              <th scope="col" className="sticky left-0 z-10 bg-slate-50/95 px-5 py-4 font-bold text-slate-950 backdrop-blur-sm sm:px-6">
                Feature
              </th>
              <th
                scope="col"
                className="px-4 py-4 text-center font-bold text-primary sm:px-5"
              >
                {COMPETITOR_LABELS.edgewise}
              </th>
              <th scope="col" className="px-4 py-4 text-center font-medium text-slate-600 sm:px-5">
                {COMPETITOR_LABELS.otherJournal}
              </th>
              <th scope="col" className="px-4 py-4 text-center font-medium text-slate-600 sm:px-5">
                {COMPETITOR_LABELS.tradervue}
              </th>
              <th scope="col" className="px-4 py-4 text-center font-medium text-slate-600 sm:px-5">
                {COMPETITOR_LABELS.edgewonk}
              </th>
            </tr>
          </thead>
          <tbody>
            {COMPETITOR_COMPARISON.map(({ name, edgewise, otherJournal, tradervue, edgewonk }, i) => (
              <tr
                key={name}
                className={i % 2 === 0 ? 'bg-white' : 'bg-slate-50/40'}
              >
                <th
                  scope="row"
                  className={`sticky left-0 z-10 bg-inherit px-5 font-medium text-slate-950 sm:px-6 ${compact ? 'py-3.5' : 'py-4'}`}
                >
                  {name}
                </th>
                <td className={`px-4 text-center sm:px-5 ${compact ? 'py-3' : 'py-4'}`}>
                  <ComparisonCell value={edgewise} />
                </td>
                <td className={`px-4 text-center sm:px-5 ${compact ? 'py-3' : 'py-4'}`}>
                  <ComparisonCell value={otherJournal} />
                </td>
                <td className={`px-4 text-center sm:px-5 ${compact ? 'py-3' : 'py-4'}`}>
                  <ComparisonCell value={tradervue} />
                </td>
                <td className={`px-4 text-center sm:px-5 ${compact ? 'py-3' : 'py-4'}`}>
                  <ComparisonCell value={edgewonk} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showDisclaimer && (
        <p className="mt-4 text-center text-xs leading-5 text-slate-400">
          Features based on publicly available information as of June 2026. Competitor offerings may
          change. Edgewonk-style refers to traditional spreadsheet-style trading journals.
        </p>
      )}
    </div>
  );
}
