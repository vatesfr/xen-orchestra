import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'

export function createSchedule(overrides: Partial<FrontXoSchedule> = {}): FrontXoSchedule {
  return {
    id: 'schedule-123' as FrontXoSchedule['id'],
    jobId: 'backup-job-123' as FrontXoSchedule['jobId'],
    name: 'Nightly',
    enabled: true,
    cron: '0 0 * * *',
    timezone: 'Europe/Paris',
    ...overrides,
  }
}
