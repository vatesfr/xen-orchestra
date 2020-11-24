export default class AbstractLogger {}

// See: https://en.wikipedia.org/wiki/Syslog#Severity_level
const LEVELS = ['emergency', 'alert', 'critical', 'error', 'warning', 'notice', 'informational', 'debug']

// Create high level log methods.
for (const level of LEVELS) {
  Object.defineProperty(AbstractLogger.prototype, level, {
    value(message, data, returnPromise) {
      return this._add(level, message, data, returnPromise)
    },
  })
}
