/**
 * A structured log entry's data payload.
 * Typically contains contextual key-value pairs (e.g. `{ vmId, path }`).
 */
type LogData = Record<string, unknown>

/**
 * A log method accepts either:
 * - a message string with optional structured data
 * - an Error instance (message is extracted, error is stored in data)
 */
type LogMethod = (message: string, data?: LogData | Error) => void

export interface Logger {
  fatal: LogMethod
  error: LogMethod
  warn: LogMethod
  info: LogMethod
  debug: LogMethod
  wrap: <T extends (...args: any[]) => any>(message: string, fn: T) => T
}

export function createLogger(namespace: string): Logger
export default createLogger
