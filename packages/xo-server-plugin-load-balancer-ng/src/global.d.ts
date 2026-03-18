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
  export interface Job {
    start(): void
    stop(): void
  }

  export interface Schedule {
    createJob(fn: () => void | Promise<void>): Job
  }

  export function createSchedule(cron: string, timezone?: string): Schedule
}
