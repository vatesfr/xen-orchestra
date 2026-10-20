import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { XoSr } from '@vates/types'

export function getBackupJobHealthCheckStatus(backupJob: FrontAnyXoBackupJob): Status | undefined {
  if (backupJob.type === 'metadataBackup') {
    return undefined
  }

  const schedulesSettings = Object.entries(backupJob.settings)
    .filter(([scheduleId]) => scheduleId !== '')
    .map(([, settings]) => settings)

  const enabledCount = schedulesSettings.filter(settings => settings?.healthCheckVmsWithTags !== undefined).length

  if (enabledCount === 0) {
    return 'disabled'
  }

  return enabledCount === schedulesSettings.length ? 'enabled' : 'at-least-one-enabled'
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
