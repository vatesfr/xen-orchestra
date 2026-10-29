declare module '@xen-orchestra/cron' {
  type Schedule = {
    next: (n: number) => Date[]
  }

  export const createSchedule: (pattern: string, zone?: string) => Schedule
}
