import { useBackupJobPlanningForm } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import { useBackupJobSourceForm } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import { useBackupJobTargetForm } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import { useBackupJobTransferForm } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getBackupJobFormInitialData } from '@/modules/backup-job/utils/backup-job-form-initial-data.util.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import { reactive } from 'vue'

export function useEditBackupJobForm(backupJob: FrontAnyXoBackupJob, schedule: FrontXoSchedule) {
  const initialData = getBackupJobFormInitialData(backupJob, schedule)

  const source = useBackupJobSourceForm(reactive(initialData.source), { isEditing: true })

  const { isIncremental, isMirror, isMetadata } = source

  const transfer = useBackupJobTransferForm(reactive(initialData.transfer), isIncremental, isMirror)

  const target = useBackupJobTargetForm(
    reactive(initialData.target),
    () => source.formData.dataSource,
    () => source.formData.sourceBackupRepository,
    { isEditing: true }
  )

  const planning = useBackupJobPlanningForm(reactive(initialData.planning))

  return {
    source,
    transfer,
    target,
    planning,
    isIncremental,
    isMirror,
    isMetadata,
  }
}
