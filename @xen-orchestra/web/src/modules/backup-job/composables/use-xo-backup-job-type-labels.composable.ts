import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobTypeLabels(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const backupJob = toComputed(rawBackupJob)

  const { t } = useI18n()

  function hasIds(pattern: unknown) {
    return extractIdsFromSimplePattern(pattern).length > 0
  }

  return computed(() => {
    const job = backupJob.value
    const labels: string[] = []

    switch (job.type) {
      case 'backup':
        if (Object.values(job.settings).some(settings => Number(settings?.snapshotRetention) > 0)) {
          labels.push(t('backup:rolling-snapshot'))
        }

        if (hasIds(job.remotes)) {
          labels.push(t('backup:vms-backup'))
        }

        if (hasIds(job.srs)) {
          labels.push(t('backup:vms-replication'))
        }
        break
      case 'metadataBackup':
        if (hasIds(job.pools)) {
          labels.push(t('backup:pool-metadata'))
        }

        if (job.xoMetadata) {
          labels.push(t('backup:xo-config'))
        }
        break
      case 'mirrorBackup':
        labels.push(t('backup:vms-mirror'))
        break
    }

    return labels
  })
}
