import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobModeLabel(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t } = useI18n()

  return computed(() => {
    if (backupJob.value.type === 'metadataBackup') {
      return ''
    }

    return backupJob.value.mode === 'delta' ? t('incremental') : t('full')
  })
}
