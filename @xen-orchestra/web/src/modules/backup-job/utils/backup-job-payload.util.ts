import type { BackupJobPlanningFormData } from '@/modules/backup-job/form/use-backup-job-planning-form.ts'
import type {
  BackupJobScopeType,
  BackupJobSourceFormData,
} from '@/modules/backup-job/form/use-backup-job-source-form.ts'
import type { BackupJobTargetBackupRepositoryFormData } from '@/modules/backup-job/form/target/use-backup-job-target-backup-repository-form.ts'
import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import type {
  BackupJobTargetFormData,
  BackupJobTargetScopeType,
} from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferFormData } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'

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
  pending: Record<string, unknown>
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
}

function toPattern(
  scopeType: BackupJobScopeType | BackupJobTargetScopeType,
  ids: string[],
  filter: string
): BackupJobPattern {
  switch (scopeType) {
    case 'manual':
      return { id: { __or: ids } }
    case 'smart':
      return filter
    default:
      return {}
  }
}

function withoutUndefined(settings: BackupJobSettings): BackupJobSettings {
  return Object.fromEntries(Object.entries(settings).filter(([, value]) => value !== undefined))
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

function getRetentionSettings(backupRepository: BackupJobTargetBackupRepositoryFormData): BackupJobSettings {
  const longTermRetention = Object.fromEntries(
    (
      [
        ['daily', backupRepository.ltrDailyRetention],
        ['weekly', backupRepository.ltrWeeklyRetention],
        ['monthly', backupRepository.ltrMonthlyRetention],
        ['yearly', backupRepository.ltrYearlyRetention],
      ] as const
    )
      .filter(([, retention]) => retention !== undefined && retention > 0)
      .map(([period, retention]) => [period, { retention, settings: {} }])
  )

  return {
    longTermRetention: Object.keys(longTermRetention).length > 0 ? longTermRetention : undefined,
    mergeBackupsSynchronously: backupRepository.mergeBackupsSynchronously || undefined,
  }
}

function getRetentionPending(
  backupRepository: BackupJobTargetBackupRepositoryFormData,
  withStrictGfs: boolean
): Record<string, unknown> {
  return {
    backupDistribution: backupRepository.backupDistribution,
    longTermRetentionKeep: {
      daily: backupRepository.ltrDailyKeep,
      weekly: backupRepository.ltrWeeklyKeep,
      monthly: backupRepository.ltrMonthlyKeep,
      yearly: backupRepository.ltrYearlyKeep,
    },
    strictGfs: withStrictGfs ? backupRepository.strictGfs : undefined,
  }
}

function getHealthCheck(healthCheck: BackupJobTargetHealthCheckFormData) {
  if (!healthCheck.healthCheckEnabled) {
    return { global: {}, schedule: {}, pending: {} }
  }

  return {
    global: {
      healthCheckVmsWithTags: healthCheck.healthCheckVmTags,
      healthCheckTimeout:
        healthCheck.healthCheckTimeout === undefined ? undefined : `${healthCheck.healthCheckTimeout}m`,
    },
    schedule: {
      healthCheckSr: healthCheck.healthCheckSr,
    },
    pending: {
      healthCheckSchedule:
        healthCheck.healthCheckSchedule === 'dynamic'
          ? {
              monthDays: healthCheck.healthCheckMonthDays,
              weekDays: healthCheck.healthCheckWeekDays,
              hours: healthCheck.healthCheckHours,
            }
          : 'always',
    },
  }
}

function getBackupRepositoryPattern(backupRepository: BackupJobTargetBackupRepositoryFormData): BackupJobPattern {
  return toPattern(
    backupRepository.backupRepositoryScopeType,
    backupRepository.backupRepositoryIds,
    backupRepository.backupRepositoryFilter
  )
}

function getSchedules(planning: BackupJobPlanningFormData): Record<string, BackupJobSchedule> {
  return {
    [SCHEDULE_KEY]: {
      cron: planning.cron,
      timezone: planning.timezone,
      enabled: planning.enabled,
    },
  }
}

function getKeyBackupPending(source: BackupJobSourceFormData, transfer: BackupJobTransferFormData) {
  if (source.mode !== 'delta') {
    return undefined
  }

  if (transfer.keyBackup !== 'dynamic') {
    return transfer.keyBackup
  }

  return {
    monthDays: transfer.keyBackupMonthDays,
    weekDays: transfer.keyBackupWeekDays,
    hours: transfer.keyBackupHours,
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
    remotes: hasBackupRepository ? getBackupRepositoryPattern(target.backupRepository) : undefined,
    srs: hasStorageRepository
      ? toPattern(
          target.storageRepository.storageRepositoryScopeType,
          target.storageRepository.storageRepositoryIds,
          target.storageRepository.storageRepositoryFilter
        )
      : undefined,
    schedules: getSchedules(planning),
    settings: {
      '': withoutUndefined({
        ...getTransferSettings(transfer),
        preferNbd: isIncremental ? transfer.preferNbd : undefined,
        nbdConcurrency: isIncremental && transfer.preferNbd ? transfer.nbdConcurrency : undefined,
        cbtDestroySnapshotData: isIncremental && transfer.preferNbd && snapshotRetention === 0 ? true : undefined,
        offlineBackup: transfer.offlineBackup || undefined,
        checkpointSnapshot: !transfer.offlineBackup && transfer.snapshotMode === 'with-memory' ? true : undefined,
        offlineSnapshot: !transfer.offlineBackup && transfer.snapshotMode === 'offline' ? true : undefined,
        ...(hasBackupRepository ? getRetentionSettings(target.backupRepository) : {}),
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      }),
      [SCHEDULE_KEY]: withoutUndefined({
        exportRetention: hasBackupRepository ? target.backupRepository.exportRetention : undefined,
        copyRetention: hasStorageRepository ? target.storageRepository.copyRetention : undefined,
        snapshotRetention,
        ...healthCheck.schedule,
      }),
    },
    pending: withoutUndefined({
      keyBackup: getKeyBackupPending(source, transfer),
      snapshotSync:
        transfer.offlineBackup || transfer.snapshotSync === 'none'
          ? undefined
          : {
              mode: transfer.snapshotSync,
              tag: transfer.snapshotSync === 'smart' ? transfer.snapshotSyncTag : undefined,
            },
      replicaDistribution: hasStorageRepository ? target.storageRepository.replicaDistribution : undefined,
      ...(hasBackupRepository ? getRetentionPending(target.backupRepository, true) : {}),
      ...healthCheck.pending,
    }),
  }
}

function toMirrorBackupJobPayload({
  source,
  transfer,
  target,
  planning,
}: BackupJobFormDataSet): MirrorBackupJobPayload {
  const healthCheck = getHealthCheck(target.healthCheck)

  return {
    type: 'mirrorBackup',
    name: source.name,
    mode: source.mode,
    proxy: source.proxy,
    sourceRemote: source.sourceBackupRepository,
    filter: getMirrorFilter(source),
    remotes: getBackupRepositoryPattern(target.backupRepository),
    schedules: getSchedules(planning),
    settings: {
      '': withoutUndefined({
        ...getTransferSettings(transfer),
        ...getRetentionSettings(target.backupRepository),
        ...getFailureSettings(planning),
        ...getReportSettings(planning),
        ...healthCheck.global,
      }),
      [SCHEDULE_KEY]: withoutUndefined({
        exportRetention: target.backupRepository.exportRetention,
        ...healthCheck.schedule,
      }),
    },
    pending: withoutUndefined({
      targetProxy: target.backupRepository.targetProxy,
      ...getRetentionPending(target.backupRepository, false),
      ...healthCheck.pending,
    }),
  }
}

function toMetadataBackupJobPayload({ source, target, planning }: BackupJobFormDataSet): MetadataBackupJobPayload {
  return {
    type: 'metadataBackup',
    name: source.name,
    proxy: target.backupRepository.targetProxy,
    xoMetadata: source.saveXoConfig,
    pools: source.savePoolsMetadata ? toPattern(source.scopeType, source.poolIds, source.poolFilter) : undefined,
    remotes: getBackupRepositoryPattern(target.backupRepository),
    schedules: getSchedules(planning),
    settings: {
      '': withoutUndefined(getReportSettings(planning)),
      [SCHEDULE_KEY]: withoutUndefined({
        retentionXoMetadata: source.saveXoConfig ? target.backupRepository.exportRetention : undefined,
        retentionPoolMetadata: source.savePoolsMetadata ? target.backupRepository.exportRetention : undefined,
      }),
    },
    pending: {},
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
