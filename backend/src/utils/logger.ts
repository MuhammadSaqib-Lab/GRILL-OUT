// Minimal structured-ish console logger. Deliberately dependency-free: a
// restaurant API this size doesn't need a log shipper, just clean,
// greppable lines with a level and timestamp. Swap for pino/winston later
// if volume ever justifies it — nothing else in the app depends on this
// implementation beyond the four methods below.

type LogMeta = Record<string, unknown>;

function line(level: string, message: string, meta?: LogMeta): string {
  const timestamp = new Date().toISOString();
  const suffix = meta && Object.keys(meta).length > 0 ? ` ${JSON.stringify(meta)}` : "";
  return `[${timestamp}] [${level}] ${message}${suffix}`;
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
