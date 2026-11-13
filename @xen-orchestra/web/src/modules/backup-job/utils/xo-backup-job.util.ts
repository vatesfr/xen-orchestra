import type {
  FrontAnyXoBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { Status } from '@core/components/status/VtsStatus.vue'
import type { VM_POWER_STATE, XoSr } from '@vates/types'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'

export const BACKUP_JOB_LAST_RUNS_COUNT = 3

export type VmsSmartModeEnabled = {
  $pool?: Record<string, unknown>
  power_state?: VM_POWER_STATE
  tags?: Record<string, unknown>
  type: 'VM'
}

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

export type BackupLogsStatus = 'success' | 'skipped' | 'failure' | 'no-run'

export function getBackupLogsStatus(backupLogs: FrontXoBackupLog[]): BackupLogsStatus {
  if (backupLogs.length === 0) {
    return 'no-run'
  }

  if (backupLogs.some(backupLog => backupLog.status === 'failure' || backupLog.status === 'interrupted')) {
    return 'failure'
  }

  if (backupLogs.some(backupLog => backupLog.status === 'skipped')) {
    return 'skipped'
  }

  return 'success'
}

export function isBackupJobEnabled(schedules: FrontXoSchedule[]): boolean {
  return schedules.some(schedule => schedule.enabled)
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

export function hasBackupJobSnapshotRetention(backupJob: FrontXoVmBackupJob): boolean {
  return Object.values(backupJob.settings).some(
    settings => typeof settings?.snapshotRetention === 'number' && settings.snapshotRetention > 0
  )
}

export function getTargetIds<TId extends string>(pattern: string | { id: TId | { __or: TId[] } } | undefined): TId[] {
  // Expression targets are only resolved when the job runs, so there are no fixed IDs to show
  if (typeof pattern === 'string') {
    return []
  }
  return extractIdsFromSimplePattern<TId>(pattern)
}

export function isBackupJobVmsSmartMode(
  vmsConfig: FrontXoVmBackupJob['vms'] | undefined
): vmsConfig is VmsSmartModeEnabled {
  if (typeof vmsConfig !== 'object' || vmsConfig === null) {
    return false
  }

  return !('id' in vmsConfig)
}
