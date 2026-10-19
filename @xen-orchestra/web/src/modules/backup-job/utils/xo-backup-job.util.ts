import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoSr } from '@vates/types'

export function getBackupJobHealthCheckStatus(backupJob: FrontAnyXoBackupJob): Status | undefined {
  if (backupJob.type === 'metadataBackup') {
    return undefined
  }

  const isEnabled = Object.entries(backupJob.settings).some(
    ([scheduleId, settings]) => scheduleId !== '' && settings?.healthCheckVmsWithTags !== undefined
  )

  return isEnabled ? 'enabled' : 'disabled'
}

export function getBackupJobHealthCheckSrIds(backupJob: FrontAnyXoBackupJob): XoSr['id'][] {
  if (backupJob.type === 'metadataBackup') {
    return []
  }

  const srIds = new Set<XoSr['id']>()

  Object.entries(backupJob.settings).forEach(([scheduleId, settings]) => {
    if (scheduleId !== '' && settings?.healthCheckVmsWithTags !== undefined && settings.healthCheckSr !== undefined) {
      srIds.add(settings.healthCheckSr as XoSr['id'])
    }
  })

  return Array.from(srIds)
}
