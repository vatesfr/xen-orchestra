import type { BackupJobTargetHealthCheckFormData } from '@/modules/backup-job/form/target/use-backup-job-target-health-check-form.ts'
import {
  createBackupJobFormDataSet,
  createPlanningFormData,
  createTargetBackupRepositoryFormData,
  createTargetHealthCheckFormData,
  createTransferFormData,
} from '@/modules/backup-job/form/use-backup-job-form-base.ts'
import type { BackupJobStorageTarget } from '@/modules/backup-job/form/use-backup-job-target-form.ts'
import type { BackupJobTransferFormData } from '@/modules/backup-job/form/use-backup-job-transfer-form.ts'
import type {
  FrontAnyXoBackupJob,
  FrontXoMetadataBackupJob,
  FrontXoMirrorBackupJob,
  FrontXoVmBackupJob,
} from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import type { BackupJobScopeType } from '@/modules/backup-job/types/backup-job-form.type.ts'
import {
  ALL_EXPRESSION,
  BACKUP_REPOSITORY_EXPRESSION_KEY,
  formatContextExpressionQuery,
  POOL_EXPRESSION_KEY,
  STORAGE_REPOSITORY_EXPRESSION_KEY,
  VM_EXPRESSION_KEY,
} from '@/modules/backup-job/utils/backup-job-expression-context.util.ts'
import {
  DAYS_BEFORE_MONTH,
  LONG_TERM_RETENTION_FIELDS,
  type LongTermRetentionPeriod,
} from '@/modules/backup-job/utils/backup-job-long-term-retention.util.ts'
import type { BackupJobFormDataSet } from '@/modules/backup-job/utils/backup-job-payload.util.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSchedule } from '@/modules/schedule/remote-resources/use-xo-schedule-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractIdsFromSimplePattern } from '@xen-orchestra/backups/extractIdsFromSimplePattern.mjs'
import { type Node, NumberOrString, parse, Property, RegExp as RegExpNode } from 'complex-matcher'

type Settings = Record<string, unknown>

type Scope<TId extends string> = {
  scopeType: BackupJobScopeType
  ids: TId[]
  filter: string
}

type RunSelection = {
  monthDays: number[]
  weekDays: number[]
  hours: number[]
}

const RUN_SELECTION_PROPERTIES: Record<string, keyof RunSelection> = {
  dayOfMonth: 'monthDays',
  dayOfWeek: 'weekDays',
  hour: 'hours',
}

function toNumber(value: unknown): number | undefined {
  return typeof value === 'number' ? value : undefined
}

function toScope<TId extends string>(pattern: unknown, expressionKey: string): Scope<TId> {
  if (typeof pattern === 'string') {
    return pattern === ALL_EXPRESSION
      ? { scopeType: 'all', ids: [], filter: '' }
      : { scopeType: 'smart', ids: [], filter: formatContextExpressionQuery(expressionKey, pattern) }
  }

  if (typeof pattern === 'object' && pattern !== null && 'id' in pattern) {
    return { scopeType: 'manual', ids: extractIdsFromSimplePattern<TId>(pattern as { id: TId }), filter: '' }
  }

  return { scopeType: 'all', ids: [], filter: '' }
}

function parseExpression(expression: string): Node | undefined {
  try {
    return parse(expression)
  } catch {
    return undefined
  }
}

function getChildren(node: Node): Node[] {
  if ('children' in node) {
    return node.children as Node[]
  }

  return 'child' in node ? [node.child as Node] : []
}

function findProperty(node: Node, name: string): Node | undefined {
  if (node instanceof Property && node.name === name) {
    return node.child
  }

  for (const child of getChildren(node)) {
    const found = findProperty(child, name)

    if (found !== undefined) {
      return found
    }
  }

  return undefined
}

function collectRunSelection(node: Node, selection: RunSelection): RunSelection {
  if (node instanceof Property && node.name in RUN_SELECTION_PROPERTIES && node.child instanceof NumberOrString) {
    selection[RUN_SELECTION_PROPERTIES[node.name]].push(Number(node.child.value))

    return selection
  }

  getChildren(node).forEach(child => collectRunSelection(child, selection))

  return selection
}

function getRunSelection(node: Node | undefined): RunSelection {
  const selection: RunSelection = { monthDays: [], weekDays: [], hours: [] }
  const run = node === undefined ? undefined : findProperty(node, 'run')

  return run === undefined ? selection : collectRunSelection(run, selection)
}

function collectTags(node: Node, tags: string[]): string[] {
  if (node instanceof RegExpNode) {
    tags.push(node.re.source.replace(/^\^/, '').replace(/\$$/, '').replace(/\\(.)/g, '$1'))

    return tags
  }

  getChildren(node).forEach(child => collectTags(child, tags))

  return tags
}

function getKeyBackup(
  fullInterval: unknown
): Pick<BackupJobTransferFormData, 'keyBackup' | 'keyBackupMonthDays' | 'keyBackupWeekDays' | 'keyBackupHours'> {
  if (fullInterval === 1) {
    return { keyBackup: 'always', keyBackupMonthDays: [], keyBackupWeekDays: [], keyBackupHours: [] }
  }

  if (typeof fullInterval !== 'string') {
    return { keyBackup: 'never', keyBackupMonthDays: [], keyBackupWeekDays: [], keyBackupHours: [] }
  }

  const { monthDays, weekDays, hours } = getRunSelection(parseExpression(fullInterval))

  return { keyBackup: 'dynamic', keyBackupMonthDays: monthDays, keyBackupWeekDays: weekDays, keyBackupHours: hours }
}

function getHealthCheckTimeout(timeout: unknown): number | undefined {
  if (typeof timeout !== 'string' || !timeout.endsWith('m')) {
    return undefined
  }

  const minutes = Number(timeout.slice(0, -1))

  return Number.isNaN(minutes) ? undefined : minutes
}

function getHealthCheck(general: Settings, schedule: Settings): BackupJobTargetHealthCheckFormData {
  const healthCheck = createTargetHealthCheckFormData()
  const vmsWithTags = schedule.healthCheckVmsWithTags

  if (vmsWithTags === undefined) {
    return healthCheck
  }

  healthCheck.healthCheckEnabled = true
  healthCheck.healthCheckSr = schedule.healthCheckSr as BackupJobTargetHealthCheckFormData['healthCheckSr']
  healthCheck.healthCheckTimeout = getHealthCheckTimeout(general.healthCheckTimeout) ?? healthCheck.healthCheckTimeout

  if (Array.isArray(vmsWithTags)) {
    healthCheck.healthCheckVmTags = vmsWithTags

    return healthCheck
  }

  if (typeof vmsWithTags === 'string') {
    const node = parseExpression(vmsWithTags)
    const tags = node === undefined ? undefined : findProperty(node, 'vm')
    const { monthDays, weekDays, hours } = getRunSelection(node)

    healthCheck.healthCheckSchedule = 'dynamic'
    healthCheck.healthCheckVmTags = tags === undefined ? [] : collectTags(tags, [])
    healthCheck.healthCheckMonthDays = monthDays
    healthCheck.healthCheckWeekDays = weekDays
    healthCheck.healthCheckHours = hours
  }

  return healthCheck
}

const LONG_TERM_RETENTION_KEEP: Record<LongTermRetentionPeriod, (settings: Settings) => number | undefined> = {
  daily: settings => toNumber(settings.firstHourOfTheDay),
  weekly: settings => toNumber(settings.firstDayOfWeek),
  monthly: settings => {
    const firstDayOfMonth = toNumber(settings.firstDayOfMonth)

    return firstDayOfMonth === undefined ? undefined : firstDayOfMonth + 1
  },
  yearly: settings => {
    const month = DAYS_BEFORE_MONTH.indexOf(toNumber(settings.firstDayOfYear) ?? -1)

    return month === -1 ? undefined : month
  },
}

function getBackupRepositoryTarget(
  backupJob: FrontAnyXoBackupJob,
  general: Settings,
  schedule: Settings
): BackupJobFormDataSet['target']['backupRepository'] {
  const backupRepository = createTargetBackupRepositoryFormData()
  const scope = toScope<FrontXoBackupRepository['id']>(backupJob.remotes, BACKUP_REPOSITORY_EXPRESSION_KEY)
  const longTermRetention = (general.longTermRetention ?? {}) as Record<
    string,
    { retention: number; settings: Settings } | undefined
  >

  backupRepository.backupRepositoryScopeType = scope.scopeType
  backupRepository.backupRepositoryIds = scope.ids
  backupRepository.backupRepositoryFilter = scope.filter
  backupRepository.backupDistribution = general.distributeBackups === true ? 'distribute' : 'every'
  backupRepository.exportRetention = toNumber(schedule.exportRetention)
  backupRepository.mergeBackupsSynchronously = general.mergeBackupsSynchronously === true

  for (const { period, retention, keep } of LONG_TERM_RETENTION_FIELDS) {
    const periodRetention = longTermRetention[period]

    if (periodRetention !== undefined) {
      backupRepository[retention] = periodRetention.retention
      backupRepository[keep] = LONG_TERM_RETENTION_KEEP[period](periodRetention.settings)
    }
  }

  return backupRepository
}

function getTransfer(
  backupJob: FrontXoVmBackupJob | FrontXoMirrorBackupJob,
  general: Settings,
  schedule: Settings
): BackupJobTransferFormData {
  const transfer = createTransferFormData()
  const maxExportRate = toNumber(general.maxExportRate)

  transfer.concurrency = toNumber(general.concurrency) ?? transfer.concurrency
  transfer.maxExportRate = maxExportRate === undefined ? undefined : maxExportRate / 1024 ** 2

  if (backupJob.type === 'mirrorBackup') {
    return transfer
  }

  const synchronizedSnapshot = general.synchronizedSnapshot

  transfer.compression = backupJob.compression ?? transfer.compression
  transfer.offlineBackup = general.offlineBackup === true
  transfer.snapshotMode =
    general.checkpointSnapshot === true ? 'with-memory' : general.offlineSnapshot === true ? 'offline' : 'default'
  transfer.snapshotSync =
    synchronizedSnapshot === true ? 'all' : typeof synchronizedSnapshot === 'string' ? 'smart' : 'none'
  transfer.snapshotSyncTag = typeof synchronizedSnapshot === 'string' ? synchronizedSnapshot : undefined
  transfer.snapshotRetention = toNumber(schedule.snapshotRetention) ?? 0

  if (backupJob.mode === 'delta') {
    transfer.preferNbd = general.preferNbd === true
    transfer.nbdConcurrency = toNumber(general.nbdConcurrency) ?? transfer.nbdConcurrency
    Object.assign(transfer, getKeyBackup(schedule.fullInterval))
  }

  return transfer
}

function getPlanning(general: Settings, schedule: FrontXoSchedule): BackupJobFormDataSet['planning'] {
  const planning = createPlanningFormData()
  const timeout = toNumber(general.timeout)

  planning.cron = schedule.cron
  planning.timezone = schedule.timezone ?? (general.timezone as string | undefined) ?? planning.timezone
  planning.timeout = timeout === undefined ? undefined : timeout / 3600e3
  planning.nRetriesVmBackupFailures = toNumber(general.nRetriesVmBackupFailures)
  planning.reportWhen = (general.reportWhen as BackupJobFormDataSet['planning']['reportWhen']) ?? planning.reportWhen
  planning.reportRecipients = (general.reportRecipients as string[] | undefined) ?? []
  planning.hideSuccessfulItems = general.hideSuccessfulItems === true

  return planning
}

function getVmBackupJobFormInitialData(
  backupJob: FrontXoVmBackupJob,
  general: Settings,
  schedule: Settings,
  formDataSet: BackupJobFormDataSet
): BackupJobFormDataSet {
  const vms = toScope<FrontXoVm['id']>(backupJob.vms, VM_EXPRESSION_KEY)
  const srs = toScope<FrontXoSr['id']>(backupJob.srs, STORAGE_REPOSITORY_EXPRESSION_KEY)
  const storageTargets: BackupJobStorageTarget[] = []

  if (backupJob.remotes !== undefined) {
    storageTargets.push('backup-repository')
  }

  if (backupJob.srs !== undefined) {
    storageTargets.push('storage-repository')
  }

  Object.assign(formDataSet.source, {
    dataSource: 'vm',
    mode: backupJob.mode,
    scopeType: vms.scopeType,
    vmIds: vms.ids,
    vmFilter: vms.filter,
  })

  formDataSet.transfer = getTransfer(backupJob, general, schedule)

  formDataSet.target = {
    storageTargets,
    backupRepository: { ...getBackupRepositoryTarget(backupJob, general, schedule), targetProxy: backupJob.proxy },
    storageRepository: {
      ...formDataSet.target.storageRepository,
      storageRepositoryScopeType: srs.scopeType,
      storageRepositoryIds: srs.ids,
      storageRepositoryFilter: srs.filter,
      replicaDistribution: general.distributeReplications === true ? 'distribute' : 'every',
      copyRetention: toNumber(schedule.copyRetention),
    },
    healthCheck: getHealthCheck(general, schedule),
  }

  return formDataSet
}

function getMirrorBackupJobFormInitialData(
  backupJob: FrontXoMirrorBackupJob,
  general: Settings,
  schedule: Settings,
  formDataSet: BackupJobFormDataSet
): BackupJobFormDataSet {
  const vmIds = backupJob.filter?.vm.uuid.__or ?? []
  const vmFilter = typeof schedule.vmFilter === 'string' ? schedule.vmFilter : undefined

  Object.assign(formDataSet.source, {
    dataSource: 'mirror',
    mode: backupJob.mode,
    proxy: backupJob.proxy,
    sourceBackupRepository: backupJob.sourceRemote,
    scopeType: vmIds.length > 0 ? 'manual' : vmFilter !== undefined ? 'smart' : 'all',
    vmIds,
    vmFilter: vmFilter === undefined ? '' : formatContextExpressionQuery(VM_EXPRESSION_KEY, vmFilter),
  })

  formDataSet.transfer = getTransfer(backupJob, general, schedule)

  formDataSet.target = {
    ...formDataSet.target,
    backupRepository: getBackupRepositoryTarget(backupJob, general, schedule),
    healthCheck: getHealthCheck(general, schedule),
  }

  return formDataSet
}

function getMetadataBackupJobFormInitialData(
  backupJob: FrontXoMetadataBackupJob,
  general: Settings,
  schedule: Settings,
  formDataSet: BackupJobFormDataSet
): BackupJobFormDataSet {
  const pools = toScope<FrontXoPool['id']>(backupJob.pools, POOL_EXPRESSION_KEY)

  Object.assign(formDataSet.source, {
    dataSource: 'metadata',
    saveXoConfig: backupJob.xoMetadata === true,
    savePoolsMetadata: backupJob.pools !== undefined,
    scopeType: pools.scopeType,
    poolIds: pools.ids,
    poolFilter: pools.filter,
  })

  formDataSet.target.backupRepository = {
    ...getBackupRepositoryTarget(backupJob, general, schedule),
    targetProxy: backupJob.proxy,
    exportRetention: toNumber(schedule.retentionXoMetadata) ?? toNumber(schedule.retentionPoolMetadata),
  }

  return formDataSet
}

export function getBackupJobFormInitialData(
  backupJob: FrontAnyXoBackupJob,
  schedule: FrontXoSchedule
): BackupJobFormDataSet {
  const general: Settings = backupJob.settings[''] ?? {}
  const scheduleSettings: Settings = backupJob.settings[schedule.id] ?? {}

  const formDataSet = createBackupJobFormDataSet()

  Object.assign(formDataSet.source, { name: backupJob.name ?? '', enabled: schedule.enabled })
  formDataSet.planning = getPlanning(general, schedule)

  switch (backupJob.type) {
    case 'mirrorBackup':
      return getMirrorBackupJobFormInitialData(backupJob, general, scheduleSettings, formDataSet)
    case 'metadataBackup':
      return getMetadataBackupJobFormInitialData(backupJob, general, scheduleSettings, formDataSet)
    default:
      return getVmBackupJobFormInitialData(backupJob, general, scheduleSettings, formDataSet)
  }
}
