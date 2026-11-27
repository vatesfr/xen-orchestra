import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { benchmarkJobMock } from '@/test/mock-backup-repository-benchmark-job.ts'

itRunsJobFromButton(BackupRepositoryTestSpeedButton, {
  targetProp: 'br',
  createTarget: createBr,
  job: benchmarkJobMock,
  offer: { label: t('action:test-speed'), icon: 'action:scan' },
})
