import { getMetadataBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-metadata-backup-job-settings'
import { getMirrorBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-mirror-backup-job-settings'
import { getVmBackupJobSettings } from '@/modules/backup/composables/backup-job-settings/get-vm-backup-job-settings'
import type { ReportWhen } from '@/modules/backup/types/backup.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { useMapper } from '@core/packages/mapper'
import { formatSpeedRaw } from '@core/utils/speed.util.ts'
import { formatTimeout } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { AnyXoBackupJob } from '@vates/types'
import { reactiveComputed } from '@vueuse/shared'
import type { Info } from 'human-format'
import type humanFormat from 'human-format'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useBackupJobSettingsUtils(rawBackupJob: MaybeRefOrGetter<AnyXoBackupJob>) {
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
        throw new Error(`Unsupported backup job type: ${(backupJob.value as AnyXoBackupJob).type}`)
    }
  })

  const nbdConcurrency = computed(() => (settings.preferNbd ? (settings.nbdConcurrency ?? 1) : undefined))

  const cbtDestroySnapshotData = computed(() =>
    !!settings.preferNbd && settings.cbtDestroySnapshotData !== undefined ? settings.cbtDestroySnapshotData : undefined
  )

  const maxExportRate = computed<Info<humanFormat.Scale<'B/s' | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s'>> | undefined>(
    () => (settings.maxExportRate ? formatSpeedRaw(settings.maxExportRate) : undefined)
  )

  const formattedTimeout = computed(() =>
    settings.timeout !== undefined ? formatTimeout(Number(settings.timeout), locale.value) : undefined
  )

  const compression = computed(() => {
    switch (settings.compression) {
      case undefined:
        return undefined
      case 'native':
        return 'GZIP'
      default:
        return settings.compression
    }
  })

  const proxy = useGetProxyById(() => backupJob.value.proxy)

  const reportWhenValueTranslation = useMapper<ReportWhen, string>(
    () => settings.reportWhen as ReportWhen | undefined,
    {
      always: t('report-when:always'),
      failure: t('report-when:skipped-and-failure'),
      error: t('report-when:error'),
      never: t('report-when:never'),
    },
    'never'
  )

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
    nbdConcurrency,
    cbtDestroySnapshotData,
    formattedTimeout,
    compression,
    reportWhenValueTranslation,
    snapshotModeTranslation,
    proxy,
  }
}
