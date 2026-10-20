import { getVmBackupJobSettings } from '@/modules/backup-job/utils/get-vm-backup-job-settings.util.ts'
import { createVmBackupJob } from '@/test/create-backup-job.ts'
import type { XoProxy } from '@vates/types'

describe('getVmBackupJobSettings', () => {
  it('reads the settings of a VM backup job', () => {
    const backupJob = createVmBackupJob({
      compression: 'zstd',
      proxy: 'proxy-123' as XoProxy['id'],
      settings: {
        '': {
          concurrency: 2,
          maxExportRate: 1048576,
          nRetriesVmBackupFailures: 1,
          backupReportTpl: 'compactMjml',
          reportWhen: 'always',
          timeout: 3600000,
          checkpointSnapshot: true,
          offlineBackup: false,
          offlineSnapshot: false,
          mergeBackupsSynchronously: true,
          reportRecipients: ['admin@example.com'],
          preferNbd: true,
          timezone: 'Europe/Paris',
        },
      },
    })

    expect(getVmBackupJobSettings(backupJob)).toEqual({
      compression: 'zstd',
      proxy: 'proxy-123',
      concurrency: 2,
      maxExportRate: 1048576,
      nRetriesVmBackupFailures: 1,
      backupReportTpl: 'compactMjml',
      reportWhen: 'always',
      timeout: 3600000,
      checkpointSnapshot: true,
      offlineBackup: false,
      offlineSnapshot: false,
      mergeBackupsSynchronously: true,
      reportRecipients: ['admin@example.com'],
    })
  })
})
