/**
 * PostHog server-side analytics (admin /analytics page).
 *
 * Requires a personal API key with Query Read scope and the project ID
 * from PostHog project settings. Use the same host as the frontend
 * (e.g. https://eu.i.posthog.com for EU cloud).
 *
 * Event → chart mapping: see posthog-analytics.constants.ts
 */
const personalApiKey = process.env.POSTHOG_PERSONAL_API_KEY?.trim() ?? '';
const projectId = process.env.POSTHOG_PROJECT_ID?.trim() ?? '';

const posthogConfig = {
  personalApiKey,
  projectId,
  host: (process.env.POSTHOG_HOST ?? 'https://eu.i.posthog.com').replace(/\/$/, ''),
  enabled: Boolean(personalApiKey && projectId),
};

export default posthogConfig;
