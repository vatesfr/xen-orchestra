declare module '@xen-orchestra/cron' {
  export function createSchedule(
    pattern: string,
    zone?: string
  ): {
    next(n: number): Date[]
  }
}
