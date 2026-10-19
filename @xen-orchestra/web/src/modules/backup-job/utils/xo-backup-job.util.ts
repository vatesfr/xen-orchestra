import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'

export function getBackupJobHealthCheckStatus(backupJob: FrontAnyXoBackupJob): Status | undefined {
  if (backupJob.type === 'metadataBackup') {
    return undefined
  }

  const isEnabled = Object.entries(backupJob.settings).some(
    ([scheduleId, settings]) => scheduleId !== '' && settings?.healthCheckVmsWithTags !== undefined
  )

  return isEnabled ? 'enabled' : 'disabled'
}
