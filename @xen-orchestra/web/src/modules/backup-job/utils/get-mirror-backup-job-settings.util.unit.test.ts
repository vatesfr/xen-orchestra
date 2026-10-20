import { getMirrorBackupJobSettings } from '@/modules/backup-job/utils/get-mirror-backup-job-settings.util.ts'
import { createMirrorBackupJob } from '@/test/create-backup-job.ts'

describe('getMirrorBackupJobSettings', () => {
  it('reads the settings of a mirror backup job', () => {
    const backupJob = createMirrorBackupJob({
      settings: {
        '': {
          concurrency: 2,
          maxExportRate: 1048576,
          nRetriesVmBackupFailures: 1,
          backupReportTpl: 'compactMjml',
          reportWhen: 'failure',
          timeout: 3600000,
          reportRecipients: ['admin@example.com'],
          mergeBackupsSynchronously: true,
          hideSuccessfulItems: true,
        },
      },
    })

    expect(getMirrorBackupJobSettings(backupJob)).toEqual({
      concurrency: 2,
      maxExportRate: 1048576,
      nRetriesVmBackupFailures: 1,
      backupReportTpl: 'compactMjml',
      reportWhen: 'failure',
      timeout: 3600000,
      reportRecipients: ['admin@example.com'],
      mergeBackupsSynchronously: true,
    })
  })
})
