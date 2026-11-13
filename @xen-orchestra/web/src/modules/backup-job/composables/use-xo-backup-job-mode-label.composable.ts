import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useGetXoBackupJobModeLabel() {
  const { t } = useI18n()

  return function getBackupJobModeLabel(backupJob: FrontAnyXoBackupJob) {
    if (backupJob.type === 'metadataBackup') {
      return ''
    }

    return backupJob.mode === 'delta' ? t('incremental') : t('full')
  }
}

export function useXoBackupJobModeLabel(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const getBackupJobModeLabel = useGetXoBackupJobModeLabel()

  return computed(() => getBackupJobModeLabel(backupJob.value))
}
