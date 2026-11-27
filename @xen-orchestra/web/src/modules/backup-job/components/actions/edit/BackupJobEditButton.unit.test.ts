import BackupJobEditButton from '@/modules/backup-job/components/actions/edit/BackupJobEditButton.vue'
import { useEditBackupJob } from '@/modules/backup-job/composables/use-edit-backup-job.composable.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'

itRunsJobFromButton(BackupJobEditButton, {
  targetProp: 'backupJob',
  createTarget: createVmBackupJob,
  // The composable runs the edit job, which calls the REST API
  job: createJobStub(useEditBackupJob, result => toJobComposableResult(result, 'editBackupJob', 'isEditingBackupJob')),
  offer: { label: t('action:edit'), icon: 'action:edit' },
  // The composable edits a single backup job
  toJobTarget: backupJob => backupJob,
})
