import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import { createBr } from '@/test/create-br.ts'
import { createJobStub, toJobComposableResult } from '@/test/create-job-result.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'

itRunsJobFromButton(BackupRepositoryForgetButton, {
  targetProp: 'br',
  createTarget: createBr,
  // The composable calls the REST API and opens SSE subscriptions
  job: createJobStub(useBackupRepositoryForget, result =>
    toJobComposableResult(result, 'forgetBackupRepositories', 'isForgettingBackupRepositories')
  ),
  offer: { label: t('action:forget'), icon: 'action:forget', accent: 'danger' },
})
