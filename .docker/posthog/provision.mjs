import { existsSync, readFileSync, writeFileSync } from 'node:fs';

import { join } from 'node:path';

import { dockerCompose, POSTHOG_DIR } from './lib/compose.mjs';

import {

  REPO_ROOT,

  applyEnvEntries,

  isEnvKeySetAnywhere,

  readEnvVar,

} from './lib/env-writer.mjs';



const PROVISIONED_PATH = join(POSTHOG_DIR, '.provisioned.json');

const BOOTSTRAP_SCRIPT = join(POSTHOG_DIR, 'scripts', 'bootstrap-instance.py');



const API_ENV_TARGETS = ['apps/api/.env', 'apps/api/.env.local'];

const WEB_ENV_TARGETS = ['apps/web/.env', 'apps/web/.env.local'];



/** @returns {string | undefined} */

function readArgValue(flag) {

  const index = process.argv.indexOf(flag);

  if (index === -1 || index + 1 >= process.argv.length) {

    return undefined;

  }

  return process.argv[index + 1];

}



/** @returns {number} */

function readPostHogPort() {

  const fromEnv = process.env.POSTHOG_PORT?.trim();

  if (fromEnv) {

    const parsed = Number.parseInt(fromEnv, 10);

    if (Number.isFinite(parsed)) {

      return parsed;

    }

  }



  const envPath = join(POSTHOG_DIR, '.env');

  const fromFile = readEnvVar(envPath, 'POSTHOG_PORT');

  const parsed = Number.parseInt(fromFile ?? '8000', 10);

  return Number.isFinite(parsed) ? parsed : 8000;

}



/** @returns {string} */

function posthogHost() {

  return `http://localhost:${readPostHogPort()}`;

}



/**

 * @param {number} timeoutMs

 */

async function waitForPostHog(timeoutMs) {

  const host = posthogHost();

  const paths = ['/_health', '/api/instance_status/', '/signup', '/'];

  const started = Date.now();



  process.stdout.write(`Waiting for PostHog at ${host} (first boot can take 5–10 min)…\n`);



  while (Date.now() - started < timeoutMs) {

    for (const path of paths) {

      try {

        const response = await fetch(`${host}${path}`, {

          redirect: 'follow',

          signal: AbortSignal.timeout(5000),

        });

        if (response.ok || response.status === 401 || response.status === 403) {

          process.stdout.write('PostHog is responding.\n');

          return;

        }

      } catch {

        // retry

      }

    }

    await new Promise((resolve) => setTimeout(resolve, 10_000));

    process.stdout.write('.');

  }



  throw new Error(

    `Timed out waiting for PostHog at ${host}. Check: docker compose -f .docker/posthog/docker-compose.hobby.yml -f docker-compose.posthog.yml --env-file .docker/posthog/.env logs web`,

  );

}



/** @returns {Record<string, unknown>} */

function loadProvisionedCache() {

  if (!existsSync(PROVISIONED_PATH)) {

    return {};

  }

  return JSON.parse(readFileSync(PROVISIONED_PATH, 'utf8'));

}



/** @param {Record<string, unknown>} data */

function saveProvisionedCache(data) {

  writeFileSync(PROVISIONED_PATH, `${JSON.stringify(data, null, 2)}\n`, 'utf8');

}



/** @returns {Record<string, unknown>} */

function runBootstrapInContainer() {

  if (!existsSync(BOOTSTRAP_SCRIPT)) {

    throw new Error(`Missing bootstrap script: ${BOOTSTRAP_SCRIPT}`);

  }



  const script = readFileSync(BOOTSTRAP_SCRIPT, 'utf8');

  const result = dockerCompose(['exec', '-T', 'web', './manage.py', 'shell'], {

    input: script,

  });



  if (result.status !== 0) {

    throw new Error(

      `PostHog bootstrap failed (exit ${result.status}).\n${result.stderr || result.stdout}`,

    );

  }



  return parseBootstrapOutput(`${result.stdout}\n${result.stderr}`);

}



/**

 * @param {string} filePath

 * @returns {Record<string, unknown>}

 */

function loadBootstrapFromFile(filePath) {

  if (!existsSync(filePath)) {

    throw new Error(`Bootstrap file not found: ${filePath}`);

  }

  return JSON.parse(readFileSync(filePath, 'utf8'));

}



/**

 * @param {string} output

 * @returns {Record<string, unknown>}

 */

function parseBootstrapOutput(output) {

  const marker = 'POSTHOG_PROVISION_JSON:';

  const line = output.split(/\r?\n/).find((entry) => entry.includes(marker));

  if (!line) {

    throw new Error(`Bootstrap did not return JSON.\n${output}`);

  }



  return JSON.parse(line.slice(line.indexOf(marker) + marker.length));

}



/**

 * @param {Record<string, unknown>} bootstrap

 * @param {Record<string, unknown>} cache

 */

function resolveKeys(bootstrap, cache) {

  const projectApiKey = String(bootstrap.project_api_key ?? '');

  const projectId = String(bootstrap.project_id ?? '');

  let personalApiKey = bootstrap.personal_api_key

    ? String(bootstrap.personal_api_key)

    : '';



  if (!personalApiKey && bootstrap.pat_exists) {

    personalApiKey = String(cache.personal_api_key ?? '');

  }



  if (!projectApiKey || !projectId) {

    throw new Error('Bootstrap response missing project id or project API key');

  }



  if (!personalApiKey) {

    throw new Error(

      'Personal API key already exists in PostHog but is not cached locally. ' +

        'Delete the key labeled "TradeJournal Platform (local dev)" in PostHog settings, ' +

        'then re-run posthog-bootstrap + posthog-provision via docker compose (see .docker/posthog/.env.example).',

    );

  }



  return { projectApiKey, projectId, personalApiKey };

}



function printManualEnvBlock(host, keys) {

  process.stdout.write('\n--- PostHog env (copy if auto-write skipped existing keys) ---\n');

  process.stdout.write(`POSTHOG_HOST=${host}\n`);

  process.stdout.write(`POSTHOG_PROJECT_ID=${keys.projectId}\n`);

  process.stdout.write(`POSTHOG_PERSONAL_API_KEY=${keys.personalApiKey}\n`);

  process.stdout.write(`NEXT_PUBLIC_POSTHOG_HOST=${host}\n`);

  process.stdout.write(`NEXT_PUBLIC_POSTHOG_KEY=${keys.projectApiKey}\n`);

  process.stdout.write('---\n\n');

}



function allKeysAlreadyConfigured(host) {

  return (

    isEnvKeySetAnywhere('POSTHOG_PERSONAL_API_KEY', API_ENV_TARGETS) &&

    isEnvKeySetAnywhere('POSTHOG_PROJECT_ID', API_ENV_TARGETS) &&

    isEnvKeySetAnywhere('POSTHOG_HOST', API_ENV_TARGETS) &&

    isEnvKeySetAnywhere('NEXT_PUBLIC_POSTHOG_KEY', WEB_ENV_TARGETS) &&

    isEnvKeySetAnywhere('NEXT_PUBLIC_POSTHOG_HOST', WEB_ENV_TARGETS)

  );

}



async function main() {

  const skipWait = process.argv.includes('--skip-wait');

  const bootstrapFile =

    readArgValue('--bootstrap-file') ?? process.env.POSTHOG_BOOTSTRAP_FILE?.trim();

  const host = posthogHost();



  if (allKeysAlreadyConfigured(host)) {

    process.stdout.write(

      'PostHog keys already set in apps/api and apps/web env files — nothing to write.\n',

    );

    return;

  }



  if (!skipWait) {

    await waitForPostHog(15 * 60 * 1000);

  }



  const bootstrap = bootstrapFile

    ? loadBootstrapFromFile(bootstrapFile)

    : runBootstrapInContainer();

  const cache = loadProvisionedCache();

  const keys = resolveKeys(bootstrap, cache);



  saveProvisionedCache({

    host,

    project_id: keys.projectId,

    project_api_key: keys.projectApiKey,

    personal_api_key: keys.personalApiKey,

    user_email: bootstrap.user_email,

    provisioned_at: new Date().toISOString(),

  });



  const { written, skipped } = applyEnvEntries([

    { key: 'POSTHOG_HOST', value: host, files: API_ENV_TARGETS },

    { key: 'POSTHOG_PROJECT_ID', value: keys.projectId, files: API_ENV_TARGETS },

    { key: 'POSTHOG_PERSONAL_API_KEY', value: keys.personalApiKey, files: API_ENV_TARGETS },

    { key: 'NEXT_PUBLIC_POSTHOG_HOST', value: host, files: WEB_ENV_TARGETS },

    { key: 'NEXT_PUBLIC_POSTHOG_KEY', value: keys.projectApiKey, files: WEB_ENV_TARGETS },

  ]);



  if (written.length > 0) {

    process.stdout.write(`Wrote env keys: ${written.join(', ')}\n`);

  }

  if (skipped.length > 0) {

    process.stdout.write(`Skipped existing keys: ${skipped.join(', ')}\n`);

  }



  printManualEnvBlock(host, keys);



  process.stdout.write('PostHog provisioning complete.\n');

  process.stdout.write(`  UI: ${host}\n`);

  if (bootstrap.created_user) {

    process.stdout.write(

      `  Dev login: ${bootstrap.user_email} / tradejournal-local-dev-only\n`,

    );

  }

  process.stdout.write('  Restart bun run dev if the API/web apps were already running.\n');

}



main().catch((error) => {

  console.error(error instanceof Error ? error.message : error);

  process.exit(1);

});


