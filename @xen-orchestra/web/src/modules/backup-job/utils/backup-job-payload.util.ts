import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type { BackupJobPlanningFormData } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import type { BackupJobSourceFormData } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobTargetFormData } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferFormData } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  ALL_EXPRESSION,
  BACKUP_REPOSITORY_EXPRESSION_KEY,
  POOL_EXPRESSION_KEY,
  STORAGE_REPOSITORY_EXPRESSION_KEY,
  toContextExpression,
  VM_EXPRESSION_KEY,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import {
  LONG_TERM_RETENTION_FIELDS,
  toLongTermRetentionKeepSettings,
} from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import { mapValues } from 'lodash-es'

const SCHEDULE_KEY = 'schedule'

export type BackupJobPattern = Record<string, unknown> | string

export type BackupJobSchedule = {
  cron: string
  timezone: string | undefined
  enabled: boolean
}

export type BackupJobSettings = Record<string, unknown>

type BackupJobBasePayload = {
  name: string
  proxy: string | undefined
  remotes: BackupJobPattern | undefined
  schedules: Record<string, BackupJobSchedule>
  settings: Record<string, BackupJobSettings>
}

export type VmBackupJobPayload = BackupJobBasePayload & {
  type: 'backup'
  mode: 'delta' | 'full'
  compression: string | undefined
  vms: BackupJobPattern
  srs: BackupJobPattern | undefined
}

export type MirrorBackupJobPayload = BackupJobBasePayload & {
  type: 'mirrorBackup'
  mode: 'delta' | 'full'
  sourceRemote: string | undefined
  filter: BackupJobPattern | null | undefined
}

export type MetadataBackupJobPayload = BackupJobBasePayload & {
  type: 'metadataBackup'
  xoMetadata: boolean
  pools: BackupJobPattern | undefined
}

export type BackupJobPayload = VmBackupJobPayload | MirrorBackupJobPayload | MetadataBackupJobPayload

export type BackupJobFormDataSet = {
  source: BackupJobSourceFormData
  transfer: BackupJobTransferFormData
  target: BackupJobTargetFormData
  planning: BackupJobPlanningFormData
}

function toIdsPattern(ids: string[]): BackupJobPattern {
  return { id: { __or: ids } }
}

function getRemovedTargetPattern(isEditing: boolean): BackupJobPattern | undefined {
  return isEditing ? toIdsPattern([]) : undefined
}

function toPattern(
  scopeType: BackupJobScopeType,
  ids: string[],
  filter: string,
  allPattern: BackupJobPattern = {}
): BackupJobPattern {
  switch (scopeType) {
    case 'manual':
      return toIdsPattern(ids)
    case 'smart':
      return filter
    default:
      return allPattern
  }
}

function getReportSettings(planning: BackupJobPlanningFormData): BackupJobSettings {
  return {
    reportWhen: planning.reportWhen,
    reportRecipients: planning.reportRecipients.length > 0 ? planning.reportRecipients : undefined,
    hideSuccessfulItems: planning.hideSuccessfulItems || undefined,
  }
}

function getFailureSettings(planning: BackupJobPlanningFormData): BackupJobSettings {
  return {
    timeout: planning.timeout === undefined ? undefined : planning.timeout * 3600e3,
    nRetriesVmBackupFailures: planning.nRetriesVmBackupFailures,
  }
}

function getTransferSettings(transfer: BackupJobTransferFormData): BackupJobSettings {
  return {
    concurrency: transfer.concurrency,
    maxExportRate: transfer.maxExportRate === undefined ? undefined : transfer.maxExportRate * 1024 ** 2,
  }
}

function toAnyOfExpression(expressions: string[]): string {
  return expressions.length === 1 ? expressions[0] : `|(${expressions.join(' ')})`
}

export function toRunExpression(monthDays: number[], weekDays: number[], hours: number[]): string {
  const days = toAnyOfExpression([
    ...monthDays.map(monthDay => `dayOfMonth:${monthDay}`),
    ...weekDays.map(weekDay => `dayOfWeek:${weekDay}`),
  ])

  return `run:(${days} ${toAnyOfExpression(hours.map(hour => `hour:${hour}`))})`
}

function getFullInterval(source: BackupJobSourceFormData, transfer: BackupJobTransferFormData) {
  if (source.mode !== 'delta' || transfer.keyBackup === 'never') {
    return undefined
  }

  if (transfer.keyBackup === 'always') {
    return 1
  }

  return toRunExpression(transfer.keyBackupMonthDays, transfer.keyBackupWeekDays, transfer.keyBackupHours)
}

function getSynchronizedSnapshot(transfer: BackupJobTransferFormData): boolean | string | undefined {
  if (transfer.offlineBackup || transfer.snapshotSync === 'none') {
    return undefined
  }

  return transfer.snapshotSync === 'smart' ? transfer.snapshotSyncTag : true
}

function getRetentionSettings(
  backupRepository: BackupJobTargetBackupRepositoryFormData,
  isActive = true
): BackupJobSettings {
  if (!isActive) {
    return { longTermRetention: undefined, mergeBackupsSynchronously: undefined, distributeBackups: undefined }
  }

  const longTermRetention = Object.fromEntries(
    LONG_TERM_RETENTION_FIELDS.map(
      ({ period, retention, keep }) => [period, backupRepository[retention], backupRepository[keep]] as const
    )
      .filter(([, retention]) => retention !== undefined && retention > 0)
      .map(([period, retention, keep]) => [
        period,
        { retention, settings: toLongTermRetentionKeepSettings(period, keep) },
      ])
  )

  return {
    longTermRetention: Object.keys(longTermRetention).length > 0 ? longTermRetention : undefined,
    mergeBackupsSynchronously: backupRepository.mergeBackupsSynchronously || undefined,
    distributeBackups: backupRepository.backupDistribution === 'distribute' || undefined,
  }
}

function toExactTagExpression(tag: string): string {
  return `/^${tag.replace(/[.*+?^${}()|[\]\\/]/g, '\\$&')}$/`
}

function getHealthCheckVmsWithTags(healthCheck: BackupJobTargetHealthCheckFormData): string[] | string {
  if (healthCheck.healthCheckSchedule !== 'dynamic') {
    return healthCheck.healthCheckVmTags
  }

  const run = toRunExpression(
    healthCheck.healthCheckMonthDays,
    healthCheck.healthCheckWeekDays,
    healthCheck.healthCheckHours
  )

  if (healthCheck.healthCheckVmTags.length === 0) {
    return run
  }

  return `vm:tags:${toAnyOfExpression(healthCheck.healthCheckVmTags.map(toExactTagExpression))} ${run}`
}

function getHealthCheck(healthCheck: BackupJobTargetHealthCheckFormData) {
  if (!healthCheck.healthCheckEnabled) {
    return {
      global: { healthCheckTimeout: undefined },
      schedule: { healthCheckSr: undefined, healthCheckVmsWithTags: undefined },
    }
  }

  return {
    global: {
      healthCheckTimeout:
        healthCheck.healthCheckTimeout === undefined ? undefined : `${healthCheck.healthCheckTimeout}m`,
    },
    schedule: {
      healthCheckSr: healthCheck.healthCheckSr,
      healthCheckVmsWithTags: getHealthCheckVmsWithTags(healthCheck),
    },
  }
}

function getBackupRepositoryPattern(
  backupRepository: BackupJobTargetBackupRepositoryFormData,
  allPattern: BackupJobPattern
): BackupJobPattern {
  return toPattern(
    backupRepository.backupRepositoryScopeType,
    backupRepository.backupRepositoryIds,
    toContextExpression(BACKUP_REPOSITORY_EXPRESSION_KEY, backupRepository.backupRepositoryFilter),
    allPattern
  )
}

function getSchedules(
  source: BackupJobSourceFormData,
  planning: BackupJobPlanningFormData,
  scheduleKey: string
): Record<string, BackupJobSchedule> {
  return {
    [scheduleKey]: {
      cron: planning.cron,
      timezone: planning.timezone,
      enabled: source.enabled,
    },
  }
}

function getMirrorFilter(source: BackupJobSourceFormData, isEditing: boolean): BackupJobPattern | null | undefined {
  if (source.scopeType !== 'manual') {
    return isEditing ? null : undefined
  }

  return { vm: { uuid: { __or: source.vmIds } } }
}

function getMirrorVmFilter(source: BackupJobSourceFormData): string | undefined {
  if (source.scopeType !== 'smart') {
    return undefined
  }

  return toContextExpression(VM_EXPRESSION_KEY, source.vmFilter)
}

function toVmBackupJobPayload(
  { source, transfer, target, planning }: BackupJobFormDataSet,
  scheduleKey: string,
  isEditing: boolean
): VmBackupJobPayload {
  const isIncremental = source.mode === 'delta'
  const hasBackupRepository = target.storageTargets.includes('backup-repository')
  const hasStorageRepository = target.storageTargets.includes('storage-repository')
  const snapshotRetention = transfer.offlineBackup ? 0 : transfer.snapshotRetention
  const healthCheck = getHealthCheck(target.healthCheck)

  return {
    type: 'backup',
    name: source.name,
    mode: source.mode,
    compression: isIncremental ? undefined : transfer.compression,
    proxy: hasBackupRepository ? target.backupRepository.targetProxy : undefined,
    vms: toPattern(source.scopeType, source.vmIds, toContextExpression(VM_EXPRESSION_KEY, source.vmFilter)),
    remotes: hasBackupRepository
      ? getBackupRepositoryPattern(target.backupRepository, ALL_EXPRESSION)
      : getRemovedTargetPattern(isEditing),
    srs: hasStorageRepository
      ? toPattern(
          target.storageRepository.storageRepositoryScopeType,
          target.storageRepository.storageRepositoryIds,
          toContextExpression(STORAGE_REPOSITORY_EXPRESSION_KEY, target.storageRepository.storageRepositoryFilter),
          ALL_EXPRESSION
        )
      : getRemovedTargetPattern(isEditing),
    schedules: getSchedules(source, planning, scheduleKey),
    settings: {
      '': {
        ...getTransferSettings(transfer),
        preferNbd: isIncremental ? transfer.preferNbd : undefined,
        nbdConcurrency: isIncremental && transfer.preferNbd ? transfer.nbdConcurrency : undefined,
        cbtDestroySnapshotData: isIncremental && transfer.preferNbd && snapshotRetention === 0 ? true : undefined,
        offlineBackup: transfer.offlineBackup || undefined,
        checkpointSnapshot: !transfer.offlineBackup && transfer.snapshotMode === 'with-memory' ? true : undefined,
        offlineSnapshot: !transfer.offlineBackup && transfer.snapshotMode === 'offline' ? true : undefined,
        synchronizedSnapshot: getSynchronizedSnapshot(transfer),
        ...getRetentionSettings(target.backupRepository, hasBackupRepository),
        distributeReplications:
          hasStorageRepository && target.storageRepository.replicaDistribution === 'distribute' ? true : undefined,
        timezone: planning.timezone,
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      },
      [scheduleKey]: {
        exportRetention: hasBackupRepository ? target.backupRepository.exportRetention : undefined,
        copyRetention: hasStorageRepository ? target.storageRepository.copyRetention : undefined,
        snapshotRetention,
        fullInterval: getFullInterval(source, transfer),
        ...healthCheck.schedule,
      },
    },
  }
}

function toMirrorBackupJobPayload(
  { source, transfer, target, planning }: BackupJobFormDataSet,
  scheduleKey: string,
  isEditing: boolean
): MirrorBackupJobPayload {
  const healthCheck = getHealthCheck(target.healthCheck)

  return {
    type: 'mirrorBackup',
    name: source.name,
    mode: source.mode,
    proxy: source.proxy,
    sourceRemote: source.sourceBackupRepository,
    filter: getMirrorFilter(source, isEditing),
    remotes: getBackupRepositoryPattern(target.backupRepository, ALL_EXPRESSION),
    schedules: getSchedules(source, planning, scheduleKey),
    settings: {
      '': {
        ...getTransferSettings(transfer),
        ...getRetentionSettings(target.backupRepository),
        timezone: planning.timezone,
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      },
      [scheduleKey]: {
        exportRetention: target.backupRepository.exportRetention,
        vmFilter: getMirrorVmFilter(source),
        ...healthCheck.schedule,
      },
    },
  }
}

function toMetadataBackupJobPayload(
  { source, target, planning }: BackupJobFormDataSet,
  scheduleKey: string,
  isEditing: boolean
): MetadataBackupJobPayload {
  return {
    type: 'metadataBackup',
    name: source.name,
    proxy: target.backupRepository.targetProxy,
    xoMetadata: source.saveXoConfig,
    pools: source.savePoolsMetadata
      ? toPattern(
          source.scopeType,
          source.poolIds,
          toContextExpression(POOL_EXPRESSION_KEY, source.poolFilter),
          ALL_EXPRESSION
        )
      : getRemovedTargetPattern(isEditing),
    remotes: getBackupRepositoryPattern(target.backupRepository, ALL_EXPRESSION),
    schedules: getSchedules(source, planning, scheduleKey),
    settings: {
      '': getReportSettings(planning),
      [scheduleKey]: {
        retentionXoMetadata: source.saveXoConfig ? target.backupRepository.exportRetention : undefined,
        retentionPoolMetadata: source.savePoolsMetadata ? target.backupRepository.exportRetention : undefined,
      },
    },
  }
}

export function mergeBackupJobSettings(
  currentSettings: Record<string, BackupJobSettings | undefined>,
  settings: Record<string, BackupJobSettings>
): Record<string, BackupJobSettings | undefined> {
  return {
    ...currentSettings,
    ...mapValues(settings, (value, key) => ({ ...currentSettings[key], ...value })),
  }
}

export function toBackupJobPayload(
  formDataSet: BackupJobFormDataSet,
  scheduleKey: string = SCHEDULE_KEY,
  isEditing = false
): BackupJobPayload {
  switch (formDataSet.source.dataSource) {
    case 'mirror':
      return toMirrorBackupJobPayload(formDataSet, scheduleKey, isEditing)
    case 'metadata':
      return toMetadataBackupJobPayload(formDataSet, scheduleKey, isEditing)
    default:
      return toVmBackupJobPayload(formDataSet, scheduleKey, isEditing)
  }
}
