import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createSchedule } from '@/test/create-schedule.ts'
import { scheduleCollectionMock } from '@/test/mock-xo-schedule-collection.ts'

/**
 * Creates a backup job with the given id and adds its `scheduleCount` schedules, `<id>-schedule-<index>`, to the
 * mocked schedule collection of `mock-xo-schedule-collection.ts`.
 */
export function seedBackupJobWithSchedules(id: string, scheduleCount = 1) {
  const backupJob = createVmBackupJob({ id: id as FrontAnyXoBackupJob['id'] })

  scheduleCollectionMock.schedules.value.push(
    ...Array.from({ length: scheduleCount }, (_, index) =>
      createSchedule({ id: `${id}-schedule-${index}` as FrontXoSchedule['id'], jobId: backupJob.id })
    )
  )

  return backupJob
}
