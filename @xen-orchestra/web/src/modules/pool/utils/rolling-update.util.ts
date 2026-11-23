import type {
  PoolRollingUpdatePrecheck,
  PoolRollingUpdateRecovery,
  PoolRollingUpdateRecoveryError,
  PoolRollingUpdateRecoveryHost,
  PoolRollingUpdateRecoveryOperatorChange,
  PoolRollingUpdateRecoveryRun,
  PoolRollingUpdateRecoveryStep,
} from '@vates/types'
import { kebabCase } from 'lodash-es'

export type RollingUpdatePageState = 'before-start' | 'running' | 'interrupted' | 'review' | 'blocked' | 'up-to-date'

export type RollingUpdateStartOptions = {
  acceptCurrentStateAsBaseline?: boolean
  bypassBackupCheck?: boolean
  shutdownPinnedVms?: boolean
}

export type RollingUpdateStartOption = keyof RollingUpdateStartOptions

export type RollingUpdateResumeOptions = {
  acceptOperatorChanges?: boolean
  bypassBackupCheck?: boolean
}

export type RollingUpdateStepColumnId = 'xostor' | 'evacuate' | 'update' | 'reboot' | 'enable' | 'restoreVms'

export type RollingUpdateStepColumn = {
  id: RollingUpdateStepColumnId
  status: PoolRollingUpdateRecoveryStep['status']
  // Which of the two XOSTOR steps runs
  runningStep?: 'linstor' | 'linstorHealth'
}

const LIVE_STATUSES: ReadonlySet<PoolRollingUpdateRecoveryRun['status']> = new Set([
  'preparing',
  'running',
  'resuming',
  'cleaning',
])

// The options the start dialog can send. `rebootVm` is not one of them: the start has no such option
const START_OPTIONS: ReadonlySet<string> = new Set<RollingUpdateStartOption>([
  'acceptCurrentStateAsBaseline',
  'bypassBackupCheck',
  'shutdownPinnedVms',
])

function isHostDone(host: PoolRollingUpdateRecoveryHost) {
  return host.status === 'succeeded' || host.status === 'not-needed'
}

export function isRollingUpdateLive(recovery: PoolRollingUpdateRecovery | undefined) {
  return recovery !== undefined && recovery.status !== 'blocked' && LIVE_STATUSES.has(recovery.status)
}

export function getRollingUpdatePageState(
  recovery: PoolRollingUpdateRecovery | undefined,
  hasSucceededInSession: boolean
): RollingUpdatePageState {
  if (recovery === undefined) {
    return hasSucceededInSession ? 'up-to-date' : 'before-start'
  }

  if (recovery.status === 'blocked') {
    return 'blocked'
  }

  if (LIVE_STATUSES.has(recovery.status)) {
    return 'running'
  }

  if (recovery.status === 'succeeded') {
    return 'review'
  }

  const onlyMigrationsFailed =
    recovery.status === 'failed' &&
    Object.values(recovery.hosts).every(isHostDone) &&
    recovery.vmConflicts.some(conflict => conflict.reason === 'migration-failed')

  return onlyMigrationsFailed ? 'review' : 'interrupted'
}

function mergeXostorSteps(
  linstor: PoolRollingUpdateRecoveryStep,
  linstorHealth: PoolRollingUpdateRecoveryStep
): RollingUpdateStepColumn | undefined {
  const steps = [linstor, linstorHealth].filter(step => step.status !== 'not-needed')

  if (steps.length === 0) {
    return undefined
  }

  if (steps.some(step => step.status === 'failed')) {
    return { id: 'xostor', status: 'failed' }
  }

  if (linstor.status === 'running') {
    return { id: 'xostor', status: 'running', runningStep: 'linstor' }
  }

  if (linstorHealth.status === 'running') {
    return { id: 'xostor', status: 'running', runningStep: 'linstorHealth' }
  }

  return {
    id: 'xostor',
    status: steps.every(step => step.status === 'observed-succeeded') ? 'observed-succeeded' : 'pending',
  }
}

/** The steps of a host, with `linstor` and `linstorHealth` merged in one XOSTOR column, absent on a pool without XOSTOR */
export function getRollingUpdateStepColumns(host: PoolRollingUpdateRecoveryHost): RollingUpdateStepColumn[] {
  const { linstor, linstorHealth, evacuate, update, reboot, enable, restoreVms } = host.steps

  const xostor = mergeXostorSteps(linstor, linstorHealth)

  return [
    ...(xostor === undefined ? [] : [xostor]),
    { id: 'evacuate', status: evacuate.status },
    { id: 'update', status: update.status },
    { id: 'reboot', status: reboot.status },
    { id: 'enable', status: enable.status },
    { id: 'restoreVms', status: restoreVms.status },
  ]
}

/** The options of the start which lift a blocking check of the precheck */
export function getOfferedStartOptions(checks: PoolRollingUpdatePrecheck[]): RollingUpdateStartOption[] {
  const options = new Set<RollingUpdateStartOption>()

  for (const { result, liftedBy } of checks) {
    if (result === 'blocking' && liftedBy !== undefined && START_OPTIONS.has(liftedBy)) {
      options.add(liftedBy as RollingUpdateStartOption)
    }
  }

  return [...options]
}

/** Whether a blocking check remains which none of the selected options lifts */
export function isRollingUpdateStartBlocked(checks: PoolRollingUpdatePrecheck[], options: RollingUpdateStartOptions) {
  return checks.some(
    ({ result, liftedBy }) =>
      result === 'blocking' &&
      (liftedBy === undefined || !START_OPTIONS.has(liftedBy) || options[liftedBy as RollingUpdateStartOption] !== true)
  )
}

/** A run can be closed once nothing which can be restored is left */
export function canCloseRollingUpdate(run: PoolRollingUpdateRecoveryRun) {
  return (run.unrestoredItems ?? []).every(item => !item.restorable)
}

function getHostDuration(host: PoolRollingUpdateRecoveryHost) {
  const steps = Object.values(host.steps)

  const starts = steps.flatMap(step => (step.startedAt === undefined ? [] : [Date.parse(step.startedAt)]))
  const ends = steps.flatMap(step => (step.finishedAt === undefined ? [] : [Date.parse(step.finishedAt)]))

  if (starts.length === 0 || ends.length === 0) {
    return undefined
  }

  return Math.max(...ends) - Math.min(...starts)
}

/** Estimated from the mean duration of the hosts already updated: unknown before the first one is done */
export function getRollingUpdateEstimatedEnd(run: PoolRollingUpdateRecoveryRun, now: number) {
  const hosts = Object.values(run.hosts)

  const durations = hosts.flatMap(host => {
    const duration = host.status === 'succeeded' ? getHostDuration(host) : undefined

    return duration === undefined ? [] : [duration]
  })

  const nRemainingHosts = hosts.filter(host => !isHostDone(host)).length

  if (durations.length === 0 || nRemainingHosts === 0) {
    return undefined
  }

  const meanDuration = durations.reduce((total, duration) => total + duration, 0) / durations.length

  return now + meanDuration * nRemainingHosts
}

export function getRollingUpdateItemKey(item: { type: string; id: string }) {
  return `${item.type}/${item.id}`
}

type Translate = (key: string, named?: Record<string, unknown>) => string

/** The kind and the name of an item of a run, e.g. "Schedule nightly" */
export function getRollingUpdateItemLabel(t: Translate, item: { type: string; id: string; name?: string }) {
  return `${t(`rolling-update:item-type:${kebabCase(item.type)}`)} ${item.name ?? item.id}`
}

export function getRollingUpdateOperatorChangeLabel(t: Translate, change: PoolRollingUpdateRecoveryOperatorChange) {
  return t(`rolling-update:operator-change:${change.observed}`, { item: getRollingUpdateItemLabel(t, change) })
}

// The XAPI codes which tell why a VM cannot leave its host, and have a label
const KNOWN_REASONS = new Set([
  'HOST_NOT_ENOUGH_FREE_MEMORY',
  'VM_LACKS_FEATURE',
  'VM_REQUIRES_NETWORK',
  'VM_REQUIRES_SR',
])

/** Why a VM cannot be migrated, in words when the XAPI code is known, e.g. "… (VM_REQUIRES_SR)" */
export function getRollingUpdateReasonLabel(t: Translate, code: string) {
  return KNOWN_REASONS.has(code) ? `${t(`rolling-update:reason:${kebabCase(code)}`)} (${code})` : code
}

/** One line for an error of a run: its details, stack included, are shown apart */
export function getRollingUpdateErrorSummary(t: Translate, error: PoolRollingUpdateRecoveryError) {
  const { code, message, params } = error

  if (code === 'CANNOT_EVACUATE_HOST' && Array.isArray(params) && typeof params[0] === 'string') {
    return t('rolling-update:error:cannot-evacuate-host', { reason: getRollingUpdateReasonLabel(t, params[0]) })
  }

  return message ?? (code !== undefined ? String(code) : t('error'))
}

/** Share of the steps which are done, among the steps the hosts need, from 0 to 100 */
export function getRollingUpdateProgress(run: PoolRollingUpdateRecoveryRun) {
  const hosts = Object.values(run.hosts)

  if (hosts.length === 0) {
    return 0
  }

  const steps = hosts.flatMap(host => Object.values(host.steps)).filter(step => step.status !== 'not-needed')

  if (steps.length === 0) {
    return 100
  }

  return Math.round((steps.filter(step => step.status === 'observed-succeeded').length / steps.length) * 100)
}

/**
 * The status to show for a host. The VMs of a host come back at the end of the run only: a host which waits for
 * nothing else is updated, even when the run stopped on another host
 */
export function getRollingUpdateHostStatus(
  host: PoolRollingUpdateRecoveryHost
): PoolRollingUpdateRecoveryHost['status'] {
  const { restoreVms, ...otherSteps } = host.steps

  const onlyWaitsForItsVms =
    host.status === 'interrupted' &&
    restoreVms.status === 'pending' &&
    Object.values(otherSteps).every(step => step.status === 'observed-succeeded' || step.status === 'not-needed')

  return onlyWaitsForItsVms ? 'succeeded' : host.status
}
