import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { omit } from 'lodash-es'

export function getBackupJobDuplicatePayload(
  backupJob: FrontAnyXoBackupJob,
  schedules: FrontXoSchedule[],
  name: string
) {
  return {
    ...omit(backupJob, ['id', 'href']),
    name,
    schedules: Object.fromEntries(
      schedules.map(schedule => [
        schedule.id,
        { cron: schedule.cron, timezone: schedule.timezone, name: schedule.name, enabled: schedule.enabled },
      ])
    ),
  }
}
