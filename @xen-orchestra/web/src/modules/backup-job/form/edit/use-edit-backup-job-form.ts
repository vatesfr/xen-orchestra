import { useBackupJobFormBase } from '@/modules/backup-job/form/use-backup-job-form-base.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'

export function useEditBackupJobForm(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule) {
  return useBackupJobFormBase(getBackupJobFormInitialData(backupJob, schedule), {
    isEditing: true,
    scheduleKey: schedule.id,
  })
}
