import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobModeLabel(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t } = useI18n()

  return useMapper(
    () => (backupJob.value.type === 'metadataBackup' ? undefined : backupJob.value.mode),
    {
      delta: t('incremental'),
      full: t('full'),
      none: '',
    },
    'none'
  )
}
