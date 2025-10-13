import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import { useXoProxyCollection } from '@/remote-resources/use-xo-proxy-collection'
import type { XoProxy } from '@/types/xo/proxy.type'
import { formatSpeedRaw } from '@core/utils/speed.util'
import { formatTimeout } from '@core/utils/time.util'
import type humanFormat from 'human-format'
import type { Info } from 'human-format'
import type { ComputedRef } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoBackupJob() {
  const { locale } = useI18n()
  const { useGetProxyById } = useXoProxyCollection()

  function getsettings(backupJob: XoBackupJob) {
    if (!backupJob.settings['']) {
      return {}
    }

    const {
      proxy,
      mode,
      nRetriesVmBackupFailures,
      timeout,
      maxExportRate,
      reportWhen,
      reportRecipients,
      backupReportTpl,
      concurrency,
      compression,
      checkpointSnapshot,
      offlineBackup,
      mergeBackupsSynchronously,
      cbtDestroySnapshotData,
      offlineSnapshot,
      preferNbd,
      nbdConcurrency,
      timezone,
      hideSuccessfulItems,
      ...other
    } = backupJob.settings['']

    return {
      proxy,
      mode,
      nRetriesVmBackupFailures,
      timeout,
      maxExportRate,
      reportWhen,
      reportRecipients: reportRecipients as string[] | undefined,
      backupReportTpl: backupReportTpl as string | undefined,
      concurrency: concurrency ? String(concurrency) : undefined,
      compression: compression as 'native' | 'zstd' | '' | undefined,
      offlineBackup: offlineBackup as boolean | undefined,
      mergeBackupsSynchronously: mergeBackupsSynchronously as boolean | undefined,
      checkpointSnapshot,
      offlineSnapshot,
      hideSuccessfulItems,
      timezone,
      cbtDestroySnapshotData,
      preferNbd,
      nbdConcurrency,
      other,
    }
  }

  function getExportRate(
    maxExportRate: number | undefined
  ): Info<humanFormat.Scale<'B/s' | 'KiB/s' | 'MiB/s' | 'GiB/s' | 'TiB/s'>> | undefined {
    if (maxExportRate === undefined) {
      return undefined
    }
    return formatSpeedRaw(maxExportRate)
  }

  function getFormattedTimeout(timeout: number | undefined): string | undefined {
    if (timeout === undefined) {
      return undefined
    }

    return formatTimeout(timeout, locale.value)
  }

  function getCompressionLabel(compression: string | undefined) {
    if (compression === undefined) {
      return undefined
    }

    if (compression === 'native') {
      return 'GZIP'
    }

    return compression
  }

  function getNbdConcurrency(backupJob: XoBackupJob): number | undefined {
    if (!getsettings(backupJob).preferNbd) {
      return undefined
    }

    return getsettings(backupJob).nbdConcurrency ?? 1
  }

  function getCbtDestroySnapshotData(backupJob: XoBackupJob): boolean | undefined {
    if (!getsettings(backupJob).preferNbd) {
      return undefined
    }

    return getsettings(backupJob).cbtDestroySnapshotData
  }

  function getProxy(backupJob: XoBackupJob): ComputedRef<XoProxy | undefined> {
    return useGetProxyById(backupJob.proxy)
  }

  return {
    getExportRate,
    getNbdConcurrency,
    getCbtDestroySnapshotData,
    getFormattedTimeout,
    getCompressionLabel,
    getProxy,
    getsettings,
  }
}
