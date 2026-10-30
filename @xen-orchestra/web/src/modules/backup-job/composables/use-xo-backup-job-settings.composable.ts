import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { BACKUP_JOB_REPORT_WHEN_LABEL_KEYS } from '@/modules/backup-job/utils/backup-job-report-when.util.ts'
import { useXoProxyCollection } from '@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { formatTimeout } from '@core/utils/time.util.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import type { XoVmBackupJob, XoVmBackupJobGeneralSettings } from '@vates/types'
import { reactiveComputed } from '@vueuse/shared'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJobSettings(rawBackupJob: MaybeRefOrGetter<FrontAnyXoBackupJob>) {
  const { locale, t } = useI18n()
  const { useGetProxyById } = useXoProxyCollection()

  const backupJob = toComputed(rawBackupJob)

  const settings = reactiveComputed<XoVmBackupJobGeneralSettings & Pick<XoVmBackupJob, 'compression'>>(() => ({
    ...backupJob.value.settings[''],
    compression: backupJob.value.type === 'backup' ? backupJob.value.compression : undefined,
  }))

  const formattedMaxExportRate = computed(() =>
    settings.maxExportRate ? formatSpeed(settings.maxExportRate) : undefined
  )

  const formattedTimeout = computed(() => formatTimeout(settings.timeout, locale.value))

  const compression = computed(() => {
    switch (settings.compression) {
      case 'native':
        return t('native')
      case 'zstd':
        return t('zstd')
      default:
        return undefined
    }
  })

  const proxy = useGetProxyById(() => backupJob.value.proxy)

  const reportWhenValueTranslation = computed(() =>
    t(BACKUP_JOB_REPORT_WHEN_LABEL_KEYS[settings.reportWhen ?? 'always'])
  )

  const snapshotModeTranslation = computed(() => {
    if (settings.checkpointSnapshot === true && settings.offlineSnapshot === false) {
      return t('with-memory')
    }

    if (settings.checkpointSnapshot === false && settings.offlineSnapshot === true) {
      return t('offline')
    }

    return t('normal')
  })

  return {
    settings,
    formattedMaxExportRate,
    formattedTimeout,
    compression,
    reportWhenValueTranslation,
    snapshotModeTranslation,
    proxy,
  }
}
