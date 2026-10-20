import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createSchedule } from '@xen-orchestra/cron'

export function getScheduleNextRun(schedule: FrontXoSchedule): Date | undefined {
  if (!schedule.enabled) {
    return undefined
  }

  return createSchedule(schedule.cron, schedule.timezone).next(1)[0]
}
