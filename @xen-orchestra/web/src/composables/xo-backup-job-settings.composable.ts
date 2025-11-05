import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import { useXoProxyCollection } from '@/remote-resources/use-xo-proxy-collection'
import { useMapper } from '@core/packages/mapper'
import { formatSpeedRaw } from '@core/utils/speed.util'
import { formatTimeout } from '@core/utils/time.util'
import { toComputed } from '@core/utils/to-computed.util'
import { reactiveComputed } from '@vueuse/shared'
import type { Info } from 'human-format'
import type humanFormat from 'human-format'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

type ReportWhen = 'always' | 'failure' | 'error' | 'never'

export function useXoBackupJobSettingsUtils(rawBackupJob: MaybeRefOrGetter<XoBackupJob>) {
  const { locale, t } = useI18n()
  const { useGetProxyById } = useXoProxyCollection()

  const backupJob = toComputed(rawBackupJob)

  const settings = reactiveComputed(() => {
    if (!backupJob.value.settings['']) {
      return {}
    }

    const {
      preferNbd,
      cbtDestroySnapshotData,
      concurrency,
      nbdConcurrency,
      maxExportRate,
      nRetriesVmBackupFailures,
      hideSuccessfulItems,
      backupReportTpl,
      reportWhen,
      timeout,
      checkpointSnapshot,
      offlineBackup,
      offlineSnapshot,
      mergeBackupsSynchronously,
      timezone,
      reportRecipients,
      ...other
    } = backupJob.value.settings['']

    return {
      compression: backupJob.value.compression,
      proxy: backupJob.value.proxy,
      preferNbd,
      cbtDestroySnapshotData,
      concurrency,
      nbdConcurrency,
      maxExportRate,
      nRetriesVmBackupFailures,
      hideSuccessfulItems,
      backupReportTpl,
      reportWhen,
      timeout,
      checkpointSnapshot,
      offlineBackup,
      offlineSnapshot,
      mergeBackupsSynchronously,
      timezone,
      reportRecipients: reportRecipients as string[],
      other,
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
    if (backupJob.value.compression === undefined) {
      return undefined
    }

    if (backupJob.value.compression === 'native') {
      return 'GZIP'
    }

    return backupJob.value.compression
  })

  const proxy = useGetProxyById(() => backupJob.value.proxy)

  const reportWhenValueTranslation = useMapper<ReportWhen, string>(
    () => settings.reportWhen as ReportWhen | undefined,
    {
      always: t('report-when.always'),
      failure: t('report-when.skipped-and-failure'),
      error: t('report-when.error'),
      never: t('report-when.never'),
    },
    'never'
  )

  const snapshotModeTranslation = computed(() => {
    if (settings.checkpointSnapshot === true && settings.offlineSnapshot === false) {
      return 'with-memory'
    }
    if (settings.checkpointSnapshot === false && settings.offlineSnapshot === true) {
      return 'offline'
    } else {
      return 'normal'
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
