import { createLogger } from '@xen-orchestra/log'
import { RPU_RECOVERY_STEP_NAMES } from '@vates/types/common'
import { randomUUID } from 'node:crypto'
import stringify from 'json-stringify-safe'
import { incorrectState, noSuchObject } from 'xo-common/api-errors.js'

import { replacer } from './_rpuObservability.mjs'

/** @typedef {import('@vates/types').PoolRollingUpdateRecoveryRun} PoolRollingUpdateRecoveryRun */

const log = createLogger('xo:rpu-recovery')

export const RPU_RECOVERY_SCHEMA_VERSION = 1

// a run in one of these statuses cannot survive a process death: it is flipped
// to `interrupted` at boot
const LIVE_RUN_STATUSES = new Set(['preparing', 'running', 'resuming', 'cleaning'])

const noop = () => {}
const asyncNoop = async () => {}

/**
 * Serializes an error through the RPU observability replacer: secret-looking
 * keys are scrubbed and the result only contains JSON-safe values.
 *
 * Never throws: a value that cannot be serialized (throwing getter or
 * `toJSON`) is reduced to its string form, and non-object values are wrapped
 * so the result is always an object.
 *
 * @param {any} error
 * @returns {object | null} JSON-safe representation, `null` for nullish errors
 */
export function filterError(error) {
  if (error == null) {
    return null
  }
  let filtered
  try {
    filtered = JSON.parse(stringify(error, replacer))
  } catch (serializationError) {
    log.warn('could not serialize an error for the RPU recovery record', { error: serializationError })
    filtered = String(error)
  }
  return typeof filtered === 'object' && filtered !== null ? filtered : { message: String(filtered) }
}

/**
 * Creates the initial `version 1` recovery record of an RPU run: status
 * `preparing`, nothing done yet.
 *
 * @param {object} params
 * @param {string} params.poolId
 * @param {object} params.options - Operator-consented options (`acceptCurrentStateAsBaseline`,
 *   `rebootVm`, `bypassBackupCheck`, `shutdownPinnedVms`), impossible to reconstruct later
 * @returns {object}
 */
export function createRpuRecoveryRecord({ poolId, options }) {
  const now = new Date().toISOString()
  return {
    schemaVersion: RPU_RECOVERY_SCHEMA_VERSION,
    runId: randomUUID(),
    poolId,
    status: 'preparing',
    startedAt: now,
    updatedAt: now,
    options,
    hosts: {},
    haltedPinnedVms: {},
    lastError: null,
  }
}

// a run that is over cannot have a host running: what it left in progress is
// reported as `interrupted`
function deriveHostStatus(steps, isRunLive) {
  const inProgress = isRunLive ? 'running' : 'interrupted'
  const statuses = RPU_RECOVERY_STEP_NAMES.map(name => steps[name]?.status ?? 'pending')
  if (statuses.includes('failed')) {
    return 'failed'
  }
  if (statuses.includes('running')) {
    return inProgress
  }
  if (statuses.every(status => status === 'not-needed')) {
    return 'not-needed'
  }
  if (statuses.every(status => status === 'observed-succeeded' || status === 'not-needed')) {
    return 'succeeded'
  }
  if (statuses.every(status => status === 'pending')) {
    return 'pending'
  }
  // partially done then stopped in between steps
  return inProgress
}

/**
 * Projects a readable record onto its public view: run identity and status,
 * dates, current task, per-host steps, last filtered error, halted pinned VMs
 * and the VMs the run could not bring home.
 *
 * Never exposes the raw intent: options, initial VM placement and agent times
 * stay in the record.
 *
 * A record of an unknown schema version is reported as `blocked`: acting on a
 * record this version of the code cannot understand would be unsafe.
 *
 * @param {object} record
 * @returns {object}
 */
export function buildRpuRecoveryView(record) {
  if (record === null || typeof record !== 'object' || record.schemaVersion !== RPU_RECOVERY_SCHEMA_VERSION) {
    return {
      poolId: record?.poolId,
      runId: record?.runId,
      status: 'blocked',
      blockedReason: `unknown schema version ${record?.schemaVersion}`,
    }
  }

  const isRunLive = LIVE_RUN_STATUSES.has(record.status)
  const hosts = {}
  for (const hostId of record.hostOrder ?? Object.keys(record.hosts ?? {})) {
    const { steps = {}, lastError } = record.hosts?.[hostId] ?? {}
    const viewSteps = {}
    for (const name of RPU_RECOVERY_STEP_NAMES) {
      const { status = 'pending', startedAt, finishedAt } = steps[name] ?? {}
      viewSteps[name] = { status, startedAt, finishedAt }
    }
    hosts[hostId] = {
      status: deriveHostStatus(steps, isRunLive),
      steps: viewSteps,
      lastError: lastError ?? null,
    }
  }

  return {
    runId: record.runId,
    poolId: record.poolId,
    status: record.status,
    startedAt: record.startedAt,
    updatedAt: record.updatedAt,
    finishedAt: record.finishedAt,
    interruptedAt: record.interruptedAt,
    taskId: record.taskId,
    variant: record.variant,
    attempt: record.attempt ?? 1,
    resumable: RESUMABLE_STATUSES.includes(record.status),
    hostOrder: record.hostOrder,
    hosts,
    lastError: record.lastError ?? null,
    haltedPinnedVms: record.haltedPinnedVms ?? {},
    vmConflicts: record.vmConflicts ?? [],
    operatorChanges: record.operatorChanges ?? [],
  }
}

/**
 * Public view of a record whose stored value cannot be decoded at all: the
 * raw value is kept untouched on disk as evidence, the view reports `blocked`.
 *
 * @param {string} poolId
 * @returns {object}
 */
export function unreadableRpuRecoveryView(poolId) {
  return { poolId, status: 'blocked', blockedReason: 'unreadable record' }
}

/**
 * Reads the record of a pool and projects it onto its public view.
 *
 * @param {object} store - LevelDB sublevel, keyed by pool id
 * @param {string} poolId
 * @returns {Promise<object | undefined>} `undefined` when the pool has no record
 */
export async function readRpuRecoveryView(store, poolId) {
  let record
  try {
    record = await store.get(poolId)
  } catch (error) {
    if (error.notFound) {
      return undefined
    }
    // undecodable value: report blocked, leave the raw value on disk as evidence
    log.warn('unreadable RPU recovery record', { error, poolId })
    return unreadableRpuRecoveryView(poolId)
  }
  return buildRpuRecoveryView(record)
}

/**
 * Reads the record of a pool in order to close it.
 *
 * @param {object} store - LevelDB sublevel, keyed by pool id
 * @param {string} poolId
 * @returns {Promise<object | null>} the record, `null` when its stored value cannot be decoded
 * @throws {Error} `noSuchObject` when the pool has no record
 * @throws {Error} `incorrectState` (property `status`) when the record belongs to a live run
 */
export async function readClosableRpuRecoveryRecord(store, poolId) {
  let record
  try {
    record = await store.get(poolId)
  } catch (error) {
    if (error.notFound) {
      throw noSuchObject(poolId, 'rollingUpdateRecovery')
    }
    log.warn('unreadable RPU recovery record', { error, poolId })
    return null
  }
  if (record?.schemaVersion === RPU_RECOVERY_SCHEMA_VERSION && LIVE_RUN_STATUSES.has(record.status)) {
    throw incorrectState({
      actual: record.status,
      expected: ['interrupted', 'failed', 'succeeded'],
      object: poolId,
      property: 'status',
    })
  }
  return record
}

/**
 * Lists what the run changed and did not restore, from the record (intent)
 * and the live state of the pool: an item is listed only when the record says
 * the run changed it and the pool still shows it changed.
 *
 * Flat list, in restore order: pool settings (HA, auto power-on, WLB, load
 * balancer), backup schedules, disabled hosts, running VMs away from their
 * home host, pinned VMs shut down by the run. Objects that no longer exist are
 * skipped: there is nothing left to restore. Displaced VMs are not listed when
 * the pool opted out of the migrate back.
 *
 * @param {object | undefined} record
 * @param {object} live
 * @param {object} live.pool - XAPI pool object
 * @param {boolean} live.loadBalancerLoaded
 * @param {(id: string) => object | undefined} live.getHost
 * @param {(id: string) => object | undefined} live.getVm
 * @param {(id: string) => object | undefined} live.getSchedule
 * @returns {Array<{ type: string, id: string, name?: string }> | null} `null` when the record cannot be read
 */
export function listUnrestoredItems(record, { pool, loadBalancerLoaded, getHost, getVm, getSchedule }) {
  if (record === null || typeof record !== 'object' || record.schemaVersion !== RPU_RECOVERY_SCHEMA_VERSION) {
    return null
  }
  const { poolId, changedByRun = {} } = record
  const items = []

  if (changedByRun.ha && !pool.ha_enabled) {
    items.push({ type: 'ha', id: poolId })
  }
  if (changedByRun.autoPowerOn && pool.other_config?.auto_poweron !== 'true') {
    items.push({ type: 'autoPowerOn', id: poolId })
  }
  if (changedByRun.wlb && !pool.wlb_enabled) {
    items.push({ type: 'wlb', id: poolId })
  }
  if (changedByRun.loadBalancer && !loadBalancerLoaded) {
    items.push({ type: 'loadBalancer', id: 'load-balancer' })
  }
  for (const scheduleId of changedByRun.schedules ?? []) {
    const schedule = getSchedule(scheduleId)
    if (schedule !== undefined && !schedule.enabled) {
      items.push({ type: 'schedule', id: scheduleId, name: schedule.name })
    }
  }

  for (const hostId of record.hostOrder ?? Object.keys(record.hosts ?? {})) {
    const { enabledBeforeUpdate, steps = {} } = record.hosts?.[hostId] ?? {}
    // the run disables a host when it starts evacuating it, and enables it
    // again as its last step
    const disabledByRun =
      enabledBeforeUpdate === true && steps.evacuate !== undefined && steps.enable?.status !== 'observed-succeeded'
    const host = disabledByRun ? getHost(hostId) : undefined
    if (host !== undefined && host.enabled === false) {
      items.push({ type: 'host', id: hostId, name: host.name_label })
    }
  }

  if (pool.other_config?.['xo:rpuMigrateVmsBack'] !== 'false') {
    for (const [vmId, homeHostId] of Object.entries(record.vmHomeById ?? {})) {
      const vm = getVm(vmId)
      if (vm !== undefined && vm.power_state === 'Running' && vm.$resident_on?.$id !== homeHostId) {
        items.push({ type: 'vm', id: vmId, name: vm.name_label })
      }
    }
  }
  for (const vmId of Object.keys(record.haltedPinnedVms ?? {})) {
    const vm = getVm(vmId)
    if (vm !== undefined && vm.power_state === 'Halted') {
      items.push({ type: 'haltedPinnedVm', id: vmId, name: vm.name_label })
    }
  }

  return items
}

/**
 * Lists what an operator changed, since the run, on what the run left changed
 * or works on: a resume would otherwise silently override the operator, or
 * skip what is gone without a word.
 *
 * Settings enabled again by hand (HA, auto power-on, WLB, backup schedules),
 * deleted backup schedules, HA heartbeat SRs which no longer exist, so HA
 * cannot be restored as it was, and hosts or VMs of the run which no longer
 * exist. The HA configuration is never exposed.
 *
 * @param {object | undefined} record
 * @param {object} live
 * @param {object} live.pool - XAPI pool object
 * @param {(id: string) => object | undefined} live.getHost
 * @param {(id: string) => object | undefined} live.getSchedule
 * @param {(id: string) => object | undefined} live.getSr
 * @param {(id: string) => object | undefined} live.getVm
 * @returns {Array<{ type: string, id: string, name?: string, expected: string, observed: string }> | null} `null` when the record cannot be read
 */
export function listOperatorChanges(record, { pool, getHost, getSchedule, getSr, getVm }) {
  if (record === null || typeof record !== 'object' || record.schemaVersion !== RPU_RECOVERY_SCHEMA_VERSION) {
    return null
  }
  const { poolId, changedByRun = {} } = record
  const enabledAgain = (type, id, name) => ({ type, id, name, expected: 'disabled', observed: 'enabled' })
  const missing = (type, id) => ({ type, id, expected: 'present', observed: 'missing' })
  const changes = []

  if (changedByRun.ha && pool.ha_enabled) {
    changes.push(enabledAgain('ha', poolId))
  }
  if (changedByRun.autoPowerOn && pool.other_config?.auto_poweron === 'true') {
    changes.push(enabledAgain('autoPowerOn', poolId))
  }
  if (changedByRun.wlb && pool.wlb_enabled) {
    changes.push(enabledAgain('wlb', poolId))
  }
  for (const scheduleId of changedByRun.schedules ?? []) {
    const schedule = getSchedule(scheduleId)
    if (schedule === undefined) {
      changes.push({ type: 'schedule', id: scheduleId, expected: 'disabled', observed: 'missing' })
    } else if (schedule.enabled === true) {
      changes.push(enabledAgain('schedule', scheduleId, schedule.name))
    }
  }
  if (changedByRun.ha && !pool.ha_enabled) {
    for (const srId of changedByRun.ha.srs ?? []) {
      if (getSr(srId) === undefined) {
        changes.push(missing('haHeartbeatSr', srId))
      }
    }
  }
  for (const hostId of new Set([...(record.hostOrder ?? []), ...Object.keys(record.hosts ?? {})])) {
    if (getHost(hostId) === undefined) {
      changes.push(missing('host', hostId))
    }
  }
  // the VMs to migrate back home or to start again, but the ones the run
  // already reported as deleted: they stay listed until Finalize
  const reportedDeleted = new Set((record.vmConflicts ?? []).filter(_ => _.reason === 'deleted').map(_ => _.vmId))
  for (const vmId of new Set([...Object.keys(record.vmHomeById ?? {}), ...Object.keys(record.haltedPinnedVms ?? {})])) {
    if (getVm(vmId) === undefined && !reportedDeleted.has(vmId)) {
      changes.push(missing('vm', vmId))
    }
  }

  // JSON round trip of the store drops the undefined names
  return JSON.parse(JSON.stringify(changes))
}

const withoutHost = (byId, hostId) => Object.fromEntries(Object.entries(byId ?? {}).filter(([, _]) => _ !== hostId))

/**
 * Takes the operator's state as the new baseline: the run no longer restores
 * the settings listed in `changes` from the record, it handles them as a new
 * run would, and forgets the hosts and VMs which no longer exist.
 *
 * @param {object} record - mutated
 * @param {object[]} changes - see listOperatorChanges
 */
function adoptOperatorChanges(record, changes) {
  const { changedByRun = {} } = record
  for (const { type, id } of changes) {
    if (type === 'host') {
      if (record.hostOrder !== undefined) {
        record.hostOrder = record.hostOrder.filter(_ => _ !== id)
      }
      delete record.hosts?.[id]
      delete record.hasMissingPatchesByHost?.[id]
      // the VMs of a host which no longer exists stay where they are
      record.vmHomeById = withoutHost(record.vmHomeById, id)
      record.haltedPinnedVms = withoutHost(record.haltedPinnedVms, id)
    } else if (type === 'vm') {
      delete record.vmHomeById?.[id]
      delete record.haltedPinnedVms?.[id]
    } else if (type === 'ha' || type === 'haHeartbeatSr') {
      delete changedByRun.ha
    } else if (type === 'schedule') {
      changedByRun.schedules = changedByRun.schedules.filter(_ => _ !== id)
    } else {
      delete changedByRun[type]
    }
  }
}

/**
 * Recorder used when a run does not track recovery (rolling pool reboot,
 * rolling pool update on a pool without recovery, see supportsRpuRecovery):
 * every method is a no-op.
 */
export const noopRpuRecorder = Object.freeze({
  markRunning: noop,
  setTaskId: noop,
  setVariant: noop,
  setPatchInventory: noop,
  setPlan: noop,
  hostStarting: noop,
  hostSkipped: noop,
  hostFailed: noop,
  stepRunning: noop,
  stepObserved: noop,
  stepNotNeeded: noop,
  stepFailed: noop,
  settingChangedByRun: asyncNoop,
  settingRestored: noop,
  recordHaltedPinnedVm: asyncNoop,
  forgetHaltedPinnedVm: noop,
  fail: asyncNoop,
  dropIfNothingToRecover: asyncNoop,
  complete: asyncNoop,
  setVmConflicts: noop,
  getVmConflicts: () => [],
})

/**
 * Restores a setting the run changed, meant to be deferred: the setting is
 * recorded as restored only once the restore succeeded. Never throws, a failed
 * restore is logged with the setting and leaves it in the record.
 *
 * @param {object} recorder
 * @param {'ha' | 'autoPowerOn' | 'wlb' | 'schedules'} name
 * @param {() => Promise<void>} restore
 * @param {string} [id] - The schedule for `schedules`
 * @returns {Promise<void>}
 */
export async function restoreRpuSetting(recorder, name, restore, id) {
  try {
    await restore()
  } catch (error) {
    log.warn('failed to restore a setting changed by the rolling pool update', { error, setting: name, id })
    return
  }
  recorder.settingRestored(name, id)
}

/**
 * Creates the recorder tracking one RPU run into its recovery record.
 *
 * Intent writes are strict (`settingChangedByRun` and `recordHaltedPinnedVm`
 * reject on write failure so the run aborts before the corresponding side
 * effect), tracking writes are best effort (a write failure is logged once,
 * the run goes on). Writes are chained so they reach the store in order.
 *
 * @param {object} params
 * @param {object} params.store - LevelDB sublevel, keyed by pool id
 * @param {object} params.record - Record already persisted by the caller
 * @returns {object}
 */
export function createRpuRecoveryRecorder({ store, record }) {
  let chain = Promise.resolve()
  let writeErrorLogged = false
  const warnOnce = error => {
    if (!writeErrorLogged) {
      writeErrorLogged = true
      log.warn('failed to write the RPU recovery record, recovery tracking is degraded', {
        error,
        poolId: record.poolId,
      })
    }
  }
  const enqueueWrite = () => {
    record.updatedAt = new Date().toISOString()
    const promise = chain.then(() => store.put(record.poolId, record))
    chain = promise.catch(noop)
    return promise
  }
  const write = () => enqueueWrite().catch(warnOnce)
  const deleteRecord = async () => {
    await chain
    await store.del(record.poolId)
  }
  // best effort: a record that survives a successful run must not be
  // reported as interrupted at the next restart
  const markSucceeded = async () => {
    record.status = 'succeeded'
    // the error of a previous attempt is not current anymore
    record.lastError = null
    record.finishedAt = new Date().toISOString()
    await enqueueWrite().catch(warnOnce)
  }
  // the record is stamped `succeeded` before the delete failure is rethrown
  const deleteOrSucceed = async () => {
    try {
      await deleteRecord()
    } catch (error) {
      await markSucceeded()
      throw error
    }
  }
  const fail = async error => {
    record.status = 'failed'
    record.lastError = filterError(error)
    record.finishedAt = new Date().toISOString()
    await enqueueWrite().catch(warnOnce)
  }
  const settingsLeftChanged = () => Object.keys(record.changedByRun ?? {})
  const hostEntry = hostId => (record.hosts[hostId] ??= { steps: {} })
  // `failed` is sticky: the first failure of a step is never downgraded
  const setStep = (hostId, name, patch) => {
    const steps = hostEntry(hostId).steps
    const step = (steps[name] ??= {})
    if (step.status !== 'failed') {
      Object.assign(step, patch)
    }
  }
  const setLastError = (hostId, error) => {
    const filtered = filterError(error)
    hostEntry(hostId).lastError = filtered
    record.lastError = filtered
  }

  return {
    runId: record.runId,
    attempt: record.attempt ?? 1,

    markRunning() {
      record.status = 'running'
      write()
    },
    setTaskId(taskId) {
      if (taskId !== undefined) {
        record.taskId = taskId
        write()
      }
    },
    setVariant(variant) {
      record.variant = variant
      write()
    },
    // on resume, the updated hosts have no missing patches anymore: the
    // inventory of the first attempt stays the reference
    setPatchInventory(hasMissingPatchesByHost) {
      record.hasMissingPatchesByHost ??= hasMissingPatchesByHost
      write()
    },
    // one write for the biggest part of the record, right before the first
    // host is handled
    setPlan({ hostOrder, vmHomeById }) {
      record.hostOrder = hostOrder
      record.vmHomeById = vmHomeById
      write()
    },
    // `enabled` before the run touches the host: a host the operator had
    // already disabled is not a change of the run. A resumed host keeps the
    // values of the first attempt, the interrupted one may have disabled it
    hostStarting(hostId, agentStartTime, enabled) {
      const entry = hostEntry(hostId)
      entry.agentStartedAtBeforeUpdate ??= agentStartTime
      entry.enabledBeforeUpdate ??= enabled
      write()
    },
    hostSkipped(hostId) {
      for (const name of RPU_RECOVERY_STEP_NAMES) {
        setStep(hostId, name, { status: 'not-needed' })
      }
      write()
    },
    // marks the step being run on this host as failed, if any: single failure
    // path for everything thrown while handling one host
    hostFailed(hostId, error) {
      const steps = hostEntry(hostId).steps
      const runningStep = RPU_RECOVERY_STEP_NAMES.find(name => steps[name]?.status === 'running')
      if (runningStep !== undefined) {
        setStep(hostId, runningStep, { status: 'failed', finishedAt: new Date().toISOString() })
      }
      setLastError(hostId, error)
      write()
    },
    stepRunning(hostId, name) {
      setStep(hostId, name, { status: 'running', startedAt: new Date().toISOString() })
      write()
    },
    stepObserved(hostId, name) {
      setStep(hostId, name, { status: 'observed-succeeded', finishedAt: new Date().toISOString() })
      write()
    },
    stepNotNeeded(hostId, name) {
      setStep(hostId, name, { status: 'not-needed' })
      write()
    },
    stepFailed(hostId, name, error) {
      setStep(hostId, name, { status: 'failed', finishedAt: new Date().toISOString() })
      setLastError(hostId, error)
      write()
    },
    /**
     * Strict: a setting the run is about to change must be on disk before the
     * change, otherwise a crash would leave it changed and nothing would know.
     *
     * @param {'ha' | 'autoPowerOn' | 'wlb' | 'loadBalancer' | 'schedules'} name
     * @param {boolean | object | string[]} [value=true] - What restoring the setting needs: `{ srs, configuration }`
     *   for `ha` (uuids of the heartbeat SRs), `{ autoload }` for `loadBalancer`, ids of the disabled schedules
     *   for `schedules`, added to the ones of the previous attempts
     * @returns {Promise<void>}
     */
    async settingChangedByRun(name, value = true) {
      const changedByRun = (record.changedByRun ??= {})
      const previous = changedByRun[name]
      changedByRun[name] =
        Array.isArray(previous) && Array.isArray(value) ? [...new Set([...previous, ...value])] : value
      try {
        await enqueueWrite()
      } catch (error) {
        // the run does not change a setting it could not record: a later
        // write must not persist it
        if (previous === undefined) {
          delete changedByRun[name]
        } else {
          changedByRun[name] = previous
        }
        throw error
      }
    },
    // a setting back to its value from before the run is no longer work left
    // by the run: `id` is the schedule for `schedules`
    settingRestored(name, id) {
      const changedByRun = record.changedByRun ?? {}
      if (changedByRun[name] === undefined) {
        return
      }
      const ids = id === undefined ? [] : (changedByRun[name] ?? []).filter(_ => _ !== id)
      if (ids.length === 0) {
        delete changedByRun[name]
      } else {
        changedByRun[name] = ids
      }
      write()
    },
    // strict: the entry must be on disk before the VM is shut down, otherwise
    // a crash would leave a halted VM nothing knows about
    async recordHaltedPinnedVm(vmId, hostId) {
      record.haltedPinnedVms[vmId] = hostId
      await enqueueWrite()
    },
    forgetHaltedPinnedVm(vmId) {
      delete record.haltedPinnedVms[vmId]
      write()
    },
    // persists the failure before the caller rethrows; never throws so the
    // original error is not masked
    fail,
    // A failure before the first host was handled leaves nothing to recover
    // once the orchestrator has restored what it changed (schedules, load
    // balancer, WLB): such a record is dropped, otherwise a refused
    // precondition (a guidance to accept, a pinned VM to shut down...) would
    // block the retry with the option the operator just consented to. Meant
    // to run after those restorations: one that failed keeps the record. Never
    // throws, the record then simply stays `failed`. Never on resume: the
    // record keeps what the previous attempts changed
    async dropIfNothingToRecover() {
      if (
        record.attempt === undefined &&
        Object.keys(record.hosts).length === 0 &&
        settingsLeftChanged().length === 0
      ) {
        await deleteRecord().catch(warnOnce)
      }
    },
    // the VMs the last migrate back could not bring home, and why: each
    // migrate back replaces them
    setVmConflicts(vmConflicts) {
      record.vmConflicts = vmConflicts
      write()
    },
    getVmConflicts() {
      return record.vmConflicts ?? []
    },
    // a successful run leaves no record behind: strict, a record left on disk
    // would report the run as interrupted at the next restart. Meant to run
    // after the restorations of the settings: one that failed keeps the record
    // `failed` with what is left, a resume restores it again. VMs left away
    // from their host keep it failed too: a resume migrates them back. VMs
    // stopped or deleted during the run keep it succeeded: the operator
    // reviews them, then finalizes
    async complete() {
      const vmConflicts = record.vmConflicts ?? []
      const strandedVms = vmConflicts.filter(_ => _.reason === 'migration-failed')
      const left = settingsLeftChanged()
      if (strandedVms.length > 0) {
        await fail(
          new Error(`could not migrate VMs back to their host: ${strandedVms.map(_ => _.vmName ?? _.vmId).join(', ')}`)
        )
      } else if (left.length > 0) {
        await fail(new Error(`settings changed by the rolling pool update not restored: ${left.join(', ')}`))
      } else if (vmConflicts.length > 0) {
        await markSucceeded()
      } else {
        await deleteOrSucceed()
      }
    },
  }
}

/**
 * Creates and persists the recovery record of a new RPU run, then returns its
 * recorder.
 *
 * Strict write: a failure rejects and must abort the RPU before any side
 * effect.
 *
 * A pool which still has a record, whatever its status, refuses a new run:
 * that record is the only trace of what the previous run left behind, and it
 * must be dealt with first. The caller holds the RPU guard of the pool, which
 * makes this check-then-write safe.
 *
 * @param {object} params
 * @param {object} params.store - LevelDB sublevel, keyed by pool id
 * @param {string} params.poolId
 * @param {object} params.options
 * @returns {Promise<object>} the recorder
 * @throws {Error} `incorrectState` (property `rollingUpdateRecovery`, actual: the status of the record) if the
 *   pool still has a record
 */
export async function startRpuRecoveryRun({ store, poolId, options }) {
  const previous = await readRpuRecoveryView(store, poolId)
  if (previous !== undefined) {
    throw incorrectState({ actual: previous.status, expected: null, object: poolId, property: 'rollingUpdateRecovery' })
  }

  const record = createRpuRecoveryRecord({ poolId, options })
  await store.put(poolId, record)
  return createRpuRecoveryRecorder({ store, record })
}

/** @type {PoolRollingUpdateRecoveryRun['status'][]} */
const RESUMABLE_STATUSES = ['failed', 'interrupted', 'blocked']

const STEPS_AFTER_EVACUATE = ['update', 'reboot', 'enable']

const isStepOver = status => status === 'observed-succeeded' || status === 'not-needed'
const isStepStarted = status => status !== 'pending' && status !== 'not-needed'

/**
 * Decides, from the record of a failed or interrupted run, what a resume does
 * with each host:
 *
 * - done: evacuated, and every later step succeeded or was not needed, it is
 *   neither evacuated nor rebooted again;
 * - unfinished: a step started and the host is not done, only the live state
 *   tells what is left (missing patches, reboot since the run touched it), see
 *   rollingPoolUpdate;
 * - not started yet, or left alone by the run (every step `not-needed`):
 *   handled as on a first attempt.
 *
 * A host whose update started, possibly in an attempt before the last one
 * (`updateStarted`, kept by resumeRpuRecoveryRun), counts as patched.
 *
 * @param {object} record - Readable record
 * @returns {{ doneHostIds: Set<string>, unfinishedHosts: object, patchedHostIds: Set<string>, hostsStarted: boolean,
 *   hostOrder: string[], vmHomeById: object, haltedPinnedVms: object, changedByRun: object }} `unfinishedHosts` maps
 *   the id of each unfinished host to its `agentStartedAtBeforeUpdate`, its `enabledBeforeUpdate` and whether the
 *   previous attempt was rebooting it (`rebooting`), `patchedHostIds` are the hosts whose update started,
 *   `hostsStarted` when a host was handled by a previous attempt, the other fields come from the record
 */
export function planRpuResume(record) {
  const doneHostIds = new Set()
  const unfinishedHosts = {}
  const patchedHostIds = new Set()
  for (const hostId of record.hostOrder ?? []) {
    const { steps = {}, agentStartedAtBeforeUpdate, enabledBeforeUpdate, updateStarted } = record.hosts[hostId] ?? {}
    const status = name => steps[name]?.status ?? 'pending'
    if (updateStarted || isStepStarted(status('update'))) {
      patchedHostIds.add(hostId)
    }
    if (status('evacuate') === 'observed-succeeded' && STEPS_AFTER_EVACUATE.every(name => isStepOver(status(name)))) {
      doneHostIds.add(hostId)
    } else if (['evacuate', ...STEPS_AFTER_EVACUATE].some(name => isStepStarted(status(name)))) {
      unfinishedHosts[hostId] = {
        agentStartedAtBeforeUpdate,
        enabledBeforeUpdate,
        rebooting: status('reboot') === 'running',
      }
    }
  }
  return {
    doneHostIds,
    unfinishedHosts,
    patchedHostIds,
    hostsStarted: Object.keys(record.hosts).length > 0,
    hostOrder: record.hostOrder ?? [],
    vmHomeById: record.vmHomeById ?? {},
    haltedPinnedVms: record.haltedPinnedVms ?? {},
    changedByRun: record.changedByRun ?? {},
  }
}

/**
 * Plan of a run that continues no previous attempt, see planRpuResume: no
 * host done, no order nor VM placement to follow, no setting left changed.
 */
export const noRpuResume = Object.freeze({
  doneHostIds: new Set(),
  unfinishedHosts: {},
  patchedHostIds: new Set(),
  hostsStarted: false,
  hostOrder: [],
  vmHomeById: {},
  haltedPinnedVms: {},
  changedByRun: {},
})

/**
 * Continues the failed or interrupted run of a pool: same `runId`, next
 * attempt.
 *
 * The steps that failed or were running in the previous attempt are set back
 * to `pending`: `failed` is sticky within an attempt, not across attempts.
 *
 * What an operator changed since the run (see listOperatorChanges) blocks the
 * record until acknowledged with `acceptOperatorChanges`: the current state is
 * then the baseline, as for a new run. A setting enabled now is disabled while
 * the run goes on and enabled again at its end, a setting still disabled stays
 * so, and the hosts and VMs which no longer exist are forgotten. The `blocked`
 * status is written best-effort, the resume is refused either way.
 *
 * Strict write of the `resuming` status: a failure rejects and must abort the
 * resume before any side effect. The caller holds the RPU guard of the pool.
 *
 * @param {object} params
 * @param {object} params.store - LevelDB sublevel, keyed by pool id
 * @param {string} params.poolId
 * @param {object} [params.live] - see listOperatorChanges, no detection when missing
 * @param {boolean} [params.acceptOperatorChanges]
 * @returns {Promise<{ recorder: object, record: object, plan: object, acceptedOperatorChanges: object[] }>} see planRpuResume for `plan`
 * @throws {Error} `noSuchObject` when the pool has no record
 * @throws {Error} `incorrectState` (property `status`) when the record is not failed, interrupted nor blocked
 * @throws {Error} `incorrectState` (property `operatorChanges`) when an operator changed a setting, or removed a host, VM or schedule of the run, and it was not acknowledged
 */
export async function resumeRpuRecoveryRun({ store, poolId, live, acceptOperatorChanges = false }) {
  let record
  try {
    record = await store.get(poolId)
  } catch (error) {
    if (error.notFound) {
      throw noSuchObject(poolId, 'rollingUpdateRecovery')
    }
    log.warn('unreadable RPU recovery record', { error, poolId })
  }
  if (record?.schemaVersion !== RPU_RECOVERY_SCHEMA_VERSION) {
    throw incorrectState({ actual: 'blocked', expected: RESUMABLE_STATUSES, object: poolId, property: 'status' })
  }
  if (!RESUMABLE_STATUSES.includes(record.status)) {
    throw incorrectState({ actual: record.status, expected: RESUMABLE_STATUSES, object: poolId, property: 'status' })
  }

  const operatorChanges = live === undefined ? [] : listOperatorChanges(record, live)
  if (operatorChanges.length > 0 && !acceptOperatorChanges) {
    record.status = 'blocked'
    record.operatorChanges = operatorChanges
    record.updatedAt = new Date().toISOString()
    try {
      await store.put(poolId, record)
    } catch (error) {
      log.warn('could not write the blocked RPU recovery record', { error, poolId })
    }
    throw incorrectState({ actual: operatorChanges, expected: [], object: poolId, property: 'operatorChanges' })
  }
  // before planRpuResume, which shares changedByRun with the record
  adoptOperatorChanges(record, operatorChanges)
  delete record.operatorChanges

  // before the reset below, which forgets the steps the previous attempt left
  // running or failed
  const plan = planRpuResume(record)

  for (const [hostId, host] of Object.entries(record.hosts)) {
    for (const name of RPU_RECOVERY_STEP_NAMES) {
      const status = host.steps[name]?.status
      if (status === 'failed' || status === 'running') {
        host.steps[name] = { status: 'pending' }
      }
    }
    // an update reset to pending is still installed: the next resume must
    // know it if this attempt fails before reaching the host
    if (plan.patchedHostIds.has(hostId)) {
      host.updateStarted = true
    }
  }
  record.status = 'resuming'
  record.attempt = (record.attempt ?? 1) + 1
  record.updatedAt = new Date().toISOString()
  delete record.finishedAt
  await store.put(poolId, record)

  return {
    recorder: createRpuRecoveryRecorder({ store, record }),
    record,
    plan,
    acceptedOperatorChanges: operatorChanges,
  }
}

/**
 * Boot reconciliation: a record left in a live status on disk cannot belong to
 * a running operation anymore since xo-server just started, flip it to
 * `interrupted`. `interruptedAt` keeps the last time the run was known alive.
 *
 * Unreadable or unknown-version records are left untouched: they are reported
 * as `blocked` at read time and the raw value is evidence.
 *
 * Never throws: errors are logged and the remaining records are still
 * processed.
 *
 * @param {object} store - LevelDB sublevel, keyed by pool id
 * @returns {Promise<void>}
 */
export async function reconcileRpuRecoveryAtBoot(store) {
  try {
    // one read per key rather than createReadStream(): a value that fails to
    // decode would error the whole stream, here it only skips that record
    for await (const poolId of store.createKeyStream()) {
      try {
        const record = await store.get(poolId)
        if (record?.schemaVersion === RPU_RECOVERY_SCHEMA_VERSION && LIVE_RUN_STATUSES.has(record.status)) {
          const { runId, status, taskId, startedAt } = record
          record.interruptedAt = record.updatedAt
          record.status = 'interrupted'
          record.updatedAt = new Date().toISOString()
          await store.put(poolId, record)
          log.info('interrupted rolling pool update detected', {
            poolId,
            runId,
            taskId,
            status,
            startedAt,
            interruptedAt: record.interruptedAt,
          })
        }
      } catch (error) {
        log.warn('could not reconcile an RPU recovery record, it will be reported as blocked', { error, poolId })
      }
    }
  } catch (error) {
    log.warn('could not list the RPU recovery records for reconciliation', { error })
  }
}
