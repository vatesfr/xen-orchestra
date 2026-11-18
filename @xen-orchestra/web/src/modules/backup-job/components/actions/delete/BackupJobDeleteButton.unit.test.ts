import BackupJobDeleteButton from '@/modules/backup-job/components/actions/delete/BackupJobDeleteButton.vue'
import { useBackupJobDelete } from '@/modules/backup-job/composables/use-backup-job-delete.composable.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'

itRunsJobFromButton(BackupJobDeleteButton, {
  targetProp: 'backupJob',
  createTarget: createVmBackupJob,
  job: createJobStub(useBackupJobDelete, result =>
    toJobComposableResult(result, 'deleteBackupJobs', 'isDeletingBackupJobs')
  ),
  offer: { label: t('action:delete'), icon: 'action:delete', accent: 'danger' },
  errorMessage: 'Backup job deletion in progress…',
})
