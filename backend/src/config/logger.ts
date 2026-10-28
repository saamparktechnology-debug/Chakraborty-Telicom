export const logger = {
  info(msg: string, meta?: Record<string, unknown>) {
    console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), msg, ...meta }));
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), msg, ...meta }));
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), msg, ...meta }));
  },
};
