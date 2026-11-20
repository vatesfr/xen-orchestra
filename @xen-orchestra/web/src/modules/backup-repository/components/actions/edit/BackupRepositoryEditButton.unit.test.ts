import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'

itRunsJobFromButton(BackupRepositoryEditButton, {
  targetProp: 'br',
  createTarget: createBr,
  // The composable runs the edit job, which calls the REST API
  job: createJobStub(useEditBackupRepository, result =>
    toJobComposableResult(result, 'editBackupRepository', 'isEditingBackupRepository')
  ),
  offer: { label: t('action:edit'), icon: 'action:edit' },
  // The composable edits a single repository
  toJobTarget: br => br,
})
