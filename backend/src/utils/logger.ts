// Minimal structured-ish console logger. Deliberately dependency-free: a
// restaurant API this size doesn't need a log shipper, just clean,
// greppable lines with a level and timestamp. Swap for pino/winston later
// if volume ever justifies it — nothing else in the app depends on this
// implementation beyond the four methods below.

type LogMeta = Record<string, unknown>;

// Last line of defence: error messages from libraries occasionally embed a
// connection string or credential. Scrub the common shapes before anything is
// written, so logs (which are often shipped to third parties) stay clean.
const URL_CREDENTIALS = /([a-z][a-z0-9+.-]*:\/\/)[^\s"'\\/@]+@/gi;
const SECRET_ASSIGNMENT = /((?:password|passwd|pwd|secret|token|api[_-]?key|authorization)["']?\s*[:=]\s*["']?)(?![[{])[^\s"',;&]+/gi;

export function redact(text: string): string {
  return text.replace(URL_CREDENTIALS, "$1***@").replace(SECRET_ASSIGNMENT, "$1***");
}

function line(level: string, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return redact(`[${timestamp}] [${level}] ${message}${suffix}`);
}

export const logger = {
  info(message: string, meta?: LogMeta) {
    console.log(line("INFO", message, meta));
  },
  warn(message: string, meta?: LogMeta) {
    console.warn(line("WARN", message, meta));
  },
  error(message: string, meta?: LogMeta) {
    console.error(line("ERROR", message, meta));
  },
};
