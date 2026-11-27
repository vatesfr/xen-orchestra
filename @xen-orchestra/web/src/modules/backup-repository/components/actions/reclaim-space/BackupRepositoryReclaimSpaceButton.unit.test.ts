import BackupRepositoryReclaimSpaceButton from '@/modules/backup-repository/components/actions/reclaim-space/BackupRepositoryReclaimSpaceButton.vue'
import { createBr } from '@/test/create-br.ts'
import { t } from '@/test/i18n.ts'
import { itRunsJobFromButton } from '@/test/job-button.ts'
import { reclaimSpaceJobMock } from '@/test/mock-backup-repository-reclaim-space-job.ts'

itRunsJobFromButton(BackupRepositoryReclaimSpaceButton, {
  targetProp: 'br',
  createTarget: createBr,
  job: reclaimSpaceJobMock,
  offer: { label: t('action:reclaim-space'), icon: 'action:reclaim-space' },
})
