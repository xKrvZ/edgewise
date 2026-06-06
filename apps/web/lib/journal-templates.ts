export interface JournalTemplate {
  id: string;
  label: string;
  title: string;
  content: string;
}

export const JOURNAL_TEMPLATES: JournalTemplate[] = [
  {
    id: 'daily-review',
    label: 'Daily review',
    title: 'Daily review',
    content: `## What went well
-

## What to improve
-

## Key lessons
-

## Tomorrow's focus
-`,
  },
  {
    id: 'pre-market',
    label: 'Pre-market plan',
    title: 'Pre-market plan',
    content: `## Market context
-

## Setups watching
-

## Risk plan
- Max loss today:
- Trades allowed:

## Mindset check
-`,
  },
  {
    id: 'post-session',
    label: 'Post-session debrief',
    title: 'Post-session debrief',
    content: `## Session summary
-

## Rule adherence
- Followed plan:
- Deviations:

## Emotional state
-

## Adjustments for next session
-`,
  },
];
