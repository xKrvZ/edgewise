import type { Mistake, Tag, Trade } from '@/lib/types';

/**
 * The backend returns trade relations as id arrays (`tagIds`/`mistakeIds`).
 * The UI renders full `Tag`/`Mistake` objects, so we resolve the ids against
 * the reference collections loaded via `useReferenceData`. If a trade already
 * carries populated `tags`/`mistakes`, those are preserved.
 */
export function resolveTradeTags(trade: Trade, tags: Tag[]): Tag[] {
  if (trade.tags && trade.tags.length > 0) return trade.tags;
  const ids = trade.tagIds ?? [];
  if (ids.length === 0) return [];
  return ids.map((id) => tags.find((t) => t.id === id)).filter((t): t is Tag => Boolean(t));
}

export function resolveTradeMistakes(trade: Trade, mistakes: Mistake[]): Mistake[] {
  if (trade.mistakes && trade.mistakes.length > 0) return trade.mistakes;
  const ids = trade.mistakeIds ?? [];
  if (ids.length === 0) return [];
  return ids.map((id) => mistakes.find((m) => m.id === id)).filter((m): m is Mistake => Boolean(m));
}

/**
 * Returns a copy of the trade with `tags`/`mistakes` populated from their ids.
 */
export function withTradeRelations(
  trade: Trade,
  refs: { tags: Tag[]; mistakes: Mistake[] },
): Trade {
  return {
    ...trade,
    tags: resolveTradeTags(trade, refs.tags),
    mistakes: resolveTradeMistakes(trade, refs.mistakes),
  };
}
