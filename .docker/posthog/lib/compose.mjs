import { spawnSync } from 'node:child_process';
import { join } from 'node:path';
import { REPO_ROOT } from './env-writer.mjs';

export const POSTHOG_DIR = join(REPO_ROOT, '.docker', 'posthog');
export const COMPOSE_FILES = [
  join(POSTHOG_DIR, 'docker-compose.hobby.yml'),
  join(REPO_ROOT, 'docker-compose.posthog.yml'),
];
export const COMPOSE_ENV_FILE = join(POSTHOG_DIR, '.env');

/**
 * @param {string[]} args
 * @param {{ input?: string, inherit?: boolean }} [options]
 */
export function dockerCompose(args, options = {}) {
  const fullArgs = [
    'compose',
    ...COMPOSE_FILES.flatMap((file) => ['-f', file]),
    '--env-file',
    COMPOSE_ENV_FILE,
    ...args,
  ];

  return spawnSync('docker', fullArgs, {
    cwd: REPO_ROOT,
    encoding: 'utf8',
    input: options.input,
    stdio: options.inherit ? 'inherit' : ['pipe', 'pipe', 'pipe'],
  });
}

