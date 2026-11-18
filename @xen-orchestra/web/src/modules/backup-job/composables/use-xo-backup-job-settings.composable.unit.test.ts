import { useXoBackupJobSettings } from '@/modules/backup-job/composables/use-xo-backup-job-settings.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import { createMetadataBackupJob, createVmBackupJob } from '@/test/create-backup-job.ts'
import { createProxy } from '@/test/create-proxy.ts'
import { proxyCollectionMock } from '@/test/mock-xo-proxy-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { formatSpeed } from '@core/utils/speed.util.ts'
import { formatTimeout } from '@core/utils/time.util.ts'
import type { XoProxy } from '@vates/types'
import { useI18n } from 'vue-i18n'

mockModule(
  import('@/modules/proxy/remote-resources/use-xo-proxy-collection.ts'),
  () => import('@/test/mock-xo-proxy-collection.ts')
)

beforeEach(() => {
  proxyCollectionMock.reset()
})

function mountSettings(backupJob: FrontAnyXoBackupJob) {
  return mountComposable(() => {
    const { t, locale } = useI18n()

    return { ...useXoBackupJobSettings(backupJob), t, locale }
  }).wrapper.vm
}

describe('useXoBackupJobSettings', () => {
  describe('report when', () => {
    it('translates when the report is sent', () => {
      const always = mountSettings(createVmBackupJob({ settings: { '': { reportWhen: 'always' } } }))
      const failure = mountSettings(createVmBackupJob({ settings: { '': { reportWhen: 'failure' } } }))
      const error = mountSettings(createVmBackupJob({ settings: { '': { reportWhen: 'error' } } }))
      const never = mountSettings(createVmBackupJob({ settings: { '': { reportWhen: 'never' } } }))

      expect(always.reportWhenValueTranslation).toBe(always.t('report-when:always'))
      expect(failure.reportWhenValueTranslation).toBe(failure.t('report-when:skipped-and-failure'))
      expect(error.reportWhenValueTranslation).toBe(error.t('report-when:error'))
      expect(never.reportWhenValueTranslation).toBe(never.t('report-when:never'))
    })

    it('sends the report after every run when the report setting is not set', () => {
      const result = mountSettings(createVmBackupJob())

      expect(result.reportWhenValueTranslation).toBe(result.t('report-when:always'))
    })
  })

  it('names the compression of the backup job', () => {
    const native = mountSettings(createVmBackupJob({ compression: 'native' }))
    const zstd = mountSettings(createVmBackupJob({ compression: 'zstd' }))

    expect(native.compression).toBe(native.t('native'))
    expect(zstd.compression).toBe(zstd.t('zstd'))
    expect(mountSettings(createVmBackupJob({ compression: '' })).compression).toBeUndefined()
  })

  it('names the snapshot mode of the backup job', () => {
    const withMemory = mountSettings(
      createVmBackupJob({ settings: { '': { checkpointSnapshot: true, offlineSnapshot: false } } })
    )
    const offline = mountSettings(
      createVmBackupJob({ settings: { '': { checkpointSnapshot: false, offlineSnapshot: true } } })
    )
    const normal = mountSettings(createVmBackupJob())

    expect(withMemory.snapshotModeTranslation).toBe(withMemory.t('with-memory'))
    expect(offline.snapshotModeTranslation).toBe(offline.t('offline'))
    expect(normal.snapshotModeTranslation).toBe(normal.t('normal'))
  })

  it('formats the timeout and the speed limit', () => {
    const result = mountSettings(createVmBackupJob({ settings: { '': { timeout: 7200000, maxExportRate: 1048576 } } }))

    expect(result.formattedTimeout).toBe(formatTimeout(7200000, result.locale))
    expect(result.formattedMaxExportRate).toBe(formatSpeed(1048576))
  })

  it('has no timeout nor speed limit when they are not set', () => {
    const result = mountSettings(createVmBackupJob())

    expect(result.formattedTimeout).toBeUndefined()
    expect(result.formattedMaxExportRate).toBeUndefined()
  })

  it('finds the proxy of the backup job', () => {
    proxyCollectionMock.proxies.value = [createProxy({ id: 'proxy-123' as XoProxy['id'], name: 'Main proxy' })]

    expect(mountSettings(createMetadataBackupJob({ proxy: 'proxy-123' as XoProxy['id'] })).proxy?.name).toBe(
      'Main proxy'
    )
    expect(mountSettings(createMetadataBackupJob()).proxy).toBeUndefined()
  })
})
