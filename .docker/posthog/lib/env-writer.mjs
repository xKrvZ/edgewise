import { existsSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = dirname(fileURLToPath(import.meta.url));
export const REPO_ROOT = process.env.REPO_ROOT?.trim() || join(__dirname, '..', '..', '..');

/** @typedef {{ key: string, value: string, files: string[] }} EnvEntry */

/**
 * @param {string} filePath
 * @returns {Map<string, string>}
 */
export function parseEnvFile(filePath) {
  const vars = new Map();
  if (!existsSync(filePath)) {
    return vars;
  }

  for (const line of readFileSync(filePath, 'utf8').split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) {
      continue;
    }
    const eq = trimmed.indexOf('=');
    if (eq <= 0) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    vars.set(key, value);
  }
  return vars;
}

/**
 * @param {string} filePath
 * @param {string} key
 * @returns {string | undefined}
 */
export function readEnvVar(filePath, key) {
  return parseEnvFile(filePath).get(key);
}

/**
 * Set an env var only when missing or blank in the target file.
 * @param {string} filePath
 * @param {string} key
 * @param {string} value
 * @returns {'written' | 'skipped' | 'created'}
 */
export function setEnvVarIfMissing(filePath, key, value) {
  const existing = readEnvVar(filePath, key);
  if (existing?.trim()) {
    return 'skipped';
  }

  const hadFile = existsSync(filePath);
  const lines = hadFile ? readFileSync(filePath, 'utf8').split(/\r?\n/) : [];
  const keyPrefix = `${key}=`;
  let replaced = false;

  for (let i = 0; i < lines.length; i++) {
    const trimmed = lines[i].trim();
    if (trimmed.startsWith('#') || !trimmed.startsWith(keyPrefix)) {
      continue;
    }
    lines[i] = `${key}=${value}`;
    replaced = true;
    break;
  }

  if (!replaced) {
    if (lines.length > 0 && lines[lines.length - 1] !== '') {
      lines.push('');
    }
    lines.push(`# Added by PostHog local docker compose provisioning`);
    lines.push(`${key}=${value}`);
  }

  writeFileSync(filePath, `${lines.join('\n').replace(/\n*$/, '')}\n`, 'utf8');
  return hadFile ? 'written' : 'created';
}

/**
 * @param {EnvEntry[]} entries
 * @returns {{ written: string[], skipped: string[] }}
 */
export function applyEnvEntries(entries) {
  /** @type {string[]} */
  const written = [];
  /** @type {string[]} */
  const skipped = [];

  for (const entry of entries) {
    for (const relativePath of entry.files) {
      const filePath = join(REPO_ROOT, relativePath);
      const result = setEnvVarIfMissing(filePath, entry.key, entry.value);
      if (result === 'skipped') {
        skipped.push(`${relativePath}:${entry.key}`);
      } else {
        written.push(`${relativePath}:${entry.key}`);
      }
    }
  }

  return { written, skipped };
}

/**
 * @param {string} key
 * @param {string[]} relativePaths
 * @returns {boolean}
 */
export function isEnvKeySetAnywhere(key, relativePaths) {
  return relativePaths.some((relativePath) => {
    const value = readEnvVar(join(REPO_ROOT, relativePath), key);
    return Boolean(value?.trim());
  });
}
