type LogLevel = 'info' | 'warn' | 'error' | 'debug';

function log(level: LogLevel, data: Record<string, unknown>, message: string) {
  const entry = {
    level,
    msg: message,
    time: new Date().toISOString(),
    ...data,
  };
  const out = level === 'error' ? process.stderr : process.stdout;
  out.write(JSON.stringify(entry) + '\n');
}

export const logger = {
  info: (data: Record<string, unknown>, msg: string) => log('info', data, msg),
  warn: (data: Record<string, unknown>, msg: string) => log('warn', data, msg),
  error: (data: Record<string, unknown>, msg: string) => log('error', data, msg),
  debug: (data: Record<string, unknown>, msg: string) => log('debug', data, msg),
};
