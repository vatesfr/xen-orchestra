import { getMetadataBackupJobSettings } from '@/modules/backup-job/utils/get-metadata-backup-job-settings.util.ts'
import { createMetadataBackupJob } from '@/test/create-backup-job.ts'
import type { XoProxy } from '@vates/types'

describe('getMetadataBackupJobSettings', () => {
  it('reads the settings of a metadata backup job', () => {
    const backupJob = createMetadataBackupJob({
      proxy: 'proxy-123' as XoProxy['id'],
      settings: {
        '': {
          backupReportTpl: 'mjml',
          reportWhen: 'failure',
          reportRecipients: ['admin@example.com'],
          hideSuccessfulItems: true,
        },
      },
    })

    expect(getMetadataBackupJobSettings(backupJob)).toEqual({
      proxy: 'proxy-123',
      backupReportTpl: 'mjml',
      reportWhen: 'failure',
      reportRecipients: ['admin@example.com'],
    })
  })

  it('has no settings for a metadata backup job without general settings', () => {
    expect(getMetadataBackupJobSettings(createMetadataBackupJob({ settings: {} }))).toEqual({})
  })
})
