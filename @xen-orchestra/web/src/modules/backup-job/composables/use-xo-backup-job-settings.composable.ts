import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { getMetadataBackupJobSettings } from '@/modules/backup-job/utils/get-metadata-backup-job-settings.util.ts'
import { getMirrorBackupJobSettings } from '@/modules/backup-job/utils/get-mirror-backup-job-settings.util.ts'
import { getVmBackupJobSettings } from '@/modules/backup-job/utils/get-vm-backup-job-settings.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { formatTimeout } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { reactiveComputed } from '@vueuse/shared'
import type humanFormat from 'human-format'
import type { Info } from 'human-format'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobSettingsUtils(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const { locale, t } = useI18n()
  const { useGetProxyById } = useXoProxyCollection()

  const backupJob = toComputed(rawBackupJob)

  const settings = reactiveComputed(() => {
    switch (backupJob.value.type) {
      case 'backup':
        return getVmBackupJobSettings(backupJob.value)
      case 'metadataBackup':
        return getMetadataBackupJobSettings(backupJob.value)
      case 'mirrorBackup':
        return getMirrorBackupJobSettings(backupJob.value)
      default:
        throw new Error(`Unsupported backup job type: ${(backupJob.value as FrontAnyXoBackupJob).type}`)
    }
  })

  const maxExportRate = computed<Info<humanFormat.Scale<'B/s' | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s'>> | undefined>(
    () => (settings.maxExportRate ? formatSpeedRaw(settings.maxExportRate, { maxDecimals: 2 }) : undefined)
  )

  const formattedTimeout = computed(() =>
    settings.timeout !== undefined ? formatTimeout(Number(settings.timeout), locale.value) : undefined
  )

  const compression = computed(() => {
    switch (settings.compression) {
      case 'native':
        return 'Native'
      case 'zstd':
        return 'Zstd'
      default:
        return undefined
    }
  })

  const proxy = useGetProxyById(() => backupJob.value.proxy)

  const reportWhenValueTranslation = computed(() => {
    switch (settings.reportWhen) {
      case 'always':
        return t('report-when:always')
      case 'failure':
        return t('report-when:skipped-and-failure')
      case 'error':
        return t('report-when:error')
      case 'never':
        return t('report-when:never')
      default:
        return undefined
    }
  })

  const snapshotModeTranslation = computed(() => {
    if (settings.checkpointSnapshot === true && settings.offlineSnapshot === false) {
      return t('with-memory')
    }

    if (settings.checkpointSnapshot === false && settings.offlineSnapshot === true) {
      return t('offline')
    } else {
      return t('normal')
    }
  })

  return {
    settings,
    maxExportRate,
    formattedTimeout,
    compression,
    reportWhenValueTranslation,
    snapshotModeTranslation,
    proxy,
  }
}
