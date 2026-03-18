declare module '@xen-orchestra/log' {
  export interface Logger {
    debug(message: string, data?: Record<string, unknown>): void
    info(message: string, data?: Record<string, unknown>): void
    warn(message: string, data?: Record<string, unknown>): void
    error(message: string, data?: Record<string, unknown>): void
  }

  export function createLogger(namespace: string): Logger
}

declare module '@xen-orchestra/cron' {
  interface Job {
    start(): void
    stop(): void
  }

  interface Schedule {
    createJob(fn: () => void | Promise<void>): Job
  }

  export function createSchedule(cron: string): Schedule
}

declare module 'limit-concurrency-decorator' {
  // limitConcurrency(n)() returns a limited version of the internal callWrapper function,
  // which accepts (this: T, methodName: string, ...args) and calls this[methodName](...args)
  type LimitedCaller = (this: object, methodName: string, ...args: unknown[]) => Promise<unknown>

  export function limitConcurrency(concurrency: number): (fn?: undefined) => LimitedCaller
}
