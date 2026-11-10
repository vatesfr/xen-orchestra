import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type { BackupJobPlanningFormData } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import type { BackupJobSourceFormData } from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobTargetFormData } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferFormData } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type { BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  LONG_TERM_RETENTION_FIELDS,
  type LongTermRetentionPeriod,
} from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'

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
  filter: BackupJobPattern | undefined
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
  allIds: {
    backupRepositories: string[]
    pools: string[]
  }
}

export const ALL_EXPRESSION = '*'

export const BACKUP_REPOSITORY_EXPRESSION_KEY = 'backupRepository'

export const STORAGE_REPOSITORY_EXPRESSION_KEY = 'sr'

function toContextExpression(key: string, query: string): string {
  return `${key}:(${query})`
}

export function formatContextExpressionQuery(key: string, expression: string): string {
  const prefix = `${key}:(`

  if (!expression.startsWith(prefix) || !expression.endsWith(')')) {
    return expression
  }

  return expression.slice(prefix.length, -1)
}

function toIdsPattern(ids: string[]): BackupJobPattern {
  return { id: { __or: ids } }
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

const DAYS_BEFORE_MONTH = [0, 31, 59, 90, 120, 151, 181, 212, 243, 273, 304, 334]

const LONG_TERM_RETENTION_KEEP_SETTINGS: Record<LongTermRetentionPeriod, (keep: number) => BackupJobSettings> = {
  daily: hour => ({ firstHourOfTheDay: hour }),
  weekly: weekDay => ({ firstDayOfWeek: weekDay }),
  monthly: monthDay => ({ firstDayOfMonth: monthDay - 1 }),
  yearly: month => ({ firstDayOfYear: DAYS_BEFORE_MONTH[month] }),
}

function getRetentionSettings(backupRepository: BackupJobTargetBackupRepositoryFormData): BackupJobSettings {
  const longTermRetention = Object.fromEntries(
    LONG_TERM_RETENTION_FIELDS.map(
      ({ period, retention, keep }) => [period, backupRepository[retention], backupRepository[keep]] as const
    )
      .filter(([, retention]) => retention !== undefined && retention > 0)
      .map(([period, retention, keep]) => [
        period,
        { retention, settings: keep === undefined ? {} : LONG_TERM_RETENTION_KEEP_SETTINGS[period](keep) },
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
    return { global: {}, schedule: {} }
  }

  return {
    global: {
      healthCheckVmsWithTags: getHealthCheckVmsWithTags(healthCheck),
      healthCheckTimeout:
        healthCheck.healthCheckTimeout === undefined ? undefined : `${healthCheck.healthCheckTimeout}m`,
    },
    schedule: {
      healthCheckSr: healthCheck.healthCheckSr,
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
  planning: BackupJobPlanningFormData
): Record<string, BackupJobSchedule> {
  return {
    [SCHEDULE_KEY]: {
      cron: planning.cron,
      timezone: planning.timezone,
      enabled: source.enabled,
    },
  }
}

function getMirrorFilter(source: BackupJobSourceFormData): BackupJobPattern | undefined {
  if (source.scopeType === 'all') {
    return undefined
  }

  if (source.scopeType === 'manual') {
    return { vm: { uuid: { __or: source.vmIds } } }
  }

  return source.vmFilter
}

function toVmBackupJobPayload({ source, transfer, target, planning }: BackupJobFormDataSet): VmBackupJobPayload {
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
    vms: toPattern(source.scopeType, source.vmIds, source.vmFilter),
    remotes: hasBackupRepository ? getBackupRepositoryPattern(target.backupRepository, ALL_EXPRESSION) : undefined,
    srs: hasStorageRepository
      ? toPattern(
          target.storageRepository.storageRepositoryScopeType,
          target.storageRepository.storageRepositoryIds,
          toContextExpression(STORAGE_REPOSITORY_EXPRESSION_KEY, target.storageRepository.storageRepositoryFilter),
          ALL_EXPRESSION
        )
      : undefined,
    schedules: getSchedules(source, planning),
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
        ...(hasBackupRepository ? getRetentionSettings(target.backupRepository) : {}),
        distributeReplications:
          hasStorageRepository && target.storageRepository.replicaDistribution === 'distribute' ? true : undefined,
        timezone: planning.timezone,
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      },
      [SCHEDULE_KEY]: {
        exportRetention: hasBackupRepository ? target.backupRepository.exportRetention : undefined,
        copyRetention: hasStorageRepository ? target.storageRepository.copyRetention : undefined,
        snapshotRetention,
        fullInterval: getFullInterval(source, transfer),
        ...healthCheck.schedule,
      },
    },
  }
}

function toMirrorBackupJobPayload({
  source,
  transfer,
  target,
  planning,
  allIds,
}: BackupJobFormDataSet): MirrorBackupJobPayload {
  const healthCheck = getHealthCheck(target.healthCheck)

  return {
    type: 'mirrorBackup',
    name: source.name,
    mode: source.mode,
    proxy: source.proxy,
    sourceRemote: source.sourceBackupRepository,
    filter: getMirrorFilter(source),
    remotes: getBackupRepositoryPattern(target.backupRepository, toIdsPattern(allIds.backupRepositories)),
    schedules: getSchedules(source, planning),
    settings: {
      '': {
        ...getTransferSettings(transfer),
        ...getRetentionSettings(target.backupRepository),
        timezone: planning.timezone,
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      },
      [SCHEDULE_KEY]: {
        exportRetention: target.backupRepository.exportRetention,
        ...healthCheck.schedule,
      },
    },
  }
}

function toMetadataBackupJobPayload({
  source,
  target,
  planning,
  allIds,
}: BackupJobFormDataSet): MetadataBackupJobPayload {
  return {
    type: 'metadataBackup',
    name: source.name,
    proxy: target.backupRepository.targetProxy,
    xoMetadata: source.saveXoConfig,
    pools: source.savePoolsMetadata
      ? toPattern(source.scopeType, source.poolIds, source.poolFilter, toIdsPattern(allIds.pools))
      : undefined,
    remotes: getBackupRepositoryPattern(target.backupRepository, toIdsPattern(allIds.backupRepositories)),
    schedules: getSchedules(source, planning),
    settings: {
      '': getReportSettings(planning),
      [SCHEDULE_KEY]: {
        retentionXoMetadata: source.saveXoConfig ? target.backupRepository.exportRetention : undefined,
        retentionPoolMetadata: source.savePoolsMetadata ? target.backupRepository.exportRetention : undefined,
      },
    },
  }
}

export function toBackupJobPayload(formDataSet: BackupJobFormDataSet): BackupJobPayload {
  switch (formDataSet.source.dataSource) {
    case 'mirror':
      return toMirrorBackupJobPayload(formDataSet)
    case 'metadata':
      return toMetadataBackupJobPayload(formDataSet)
    default:
      return toVmBackupJobPayload(formDataSet)
  }
}
