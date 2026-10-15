import { createLogger } from '@xen-orchestra/log'
import { RPU_RECOVERY_STEP_NAMES } from '@vates/types/common'
import { randomUUID } from 'node:crypto'
import stringify from 'json-stringify-safe'
import { incorrectState, noSuchObject } from 'xo-common/api-errors.js'

import { replacer } from './_rpuObservability.mjs'

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

function deriveHostStatus(steps) {
  const statuses = RPU_RECOVERY_STEP_NAMES.map(name => steps[name]?.status ?? 'pending')
  if (statuses.includes('failed')) {
    return 'failed'
  }
  if (statuses.includes('running')) {
    return 'running'
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
  return 'running'
}

/**
 * Projects a readable record onto its public view: run identity and status,
 * dates, current task, per-host steps, last filtered error and halted pinned
 * VMs.
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

  const hosts = {}
  for (const hostId of record.hostOrder ?? Object.keys(record.hosts ?? {})) {
    const { steps = {}, lastError } = record.hosts?.[hostId] ?? {}
    const viewSteps = {}
    for (const name of RPU_RECOVERY_STEP_NAMES) {
      const { status = 'pending', startedAt, finishedAt } = steps[name] ?? {}
      viewSteps[name] = { status, startedAt, finishedAt }
    }
    hosts[hostId] = {
      status: deriveHostStatus(steps),
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
    hostOrder: record.hostOrder,
    hosts,
    lastError: record.lastError ?? null,
    haltedPinnedVms: record.haltedPinnedVms ?? {},
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
  recordHaltedPinnedVm: asyncNoop,
  forgetHaltedPinnedVm: noop,
  fail: asyncNoop,
  dropIfNothingToRecover: asyncNoop,
  delete: asyncNoop,
})

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
  // a record that survives a successful run must not be reported as
  // interrupted at the next restart: it is stamped `succeeded` (best effort)
  // before the delete failure is rethrown
  const deleteOrSucceed = async () => {
    try {
      await deleteRecord()
    } catch (error) {
      record.status = 'succeeded'
      record.finishedAt = new Date().toISOString()
      await enqueueWrite().catch(warnOnce)
      throw error
    }
  }
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
    setPatchInventory(hasMissingPatchesByHost) {
      record.hasMissingPatchesByHost = hasMissingPatchesByHost
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
    // already disabled is not a change of the run
    hostStarting(hostId, agentStartTime, enabled) {
      const entry = hostEntry(hostId)
      entry.agentStartedAtBeforeUpdate = agentStartTime
      entry.enabledBeforeUpdate = enabled
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
     * @param {boolean | string[]} [value=true] - Ids of the disabled schedules for `schedules`
     * @returns {Promise<void>}
     */
    async settingChangedByRun(name, value = true) {
      ;(record.changedByRun ??= {})[name] = value
      await enqueueWrite()
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
    async fail(error) {
      record.status = 'failed'
      record.lastError = filterError(error)
      record.finishedAt = new Date().toISOString()
      await enqueueWrite().catch(warnOnce)
    },
    // A failure before the first host was handled leaves nothing to recover
    // once the orchestrator has restored what it changed (schedules, load
    // balancer, WLB): such a record is dropped, otherwise a refused
    // precondition (a guidance to accept, a pinned VM to shut down...) would
    // block the retry with the option the operator just consented to. Meant
    // to run after those restorations, so that a record still on disk means
    // some of them may not have happened; never throws, the record then
    // simply stays `failed`
    async dropIfNothingToRecover() {
      if (Object.keys(record.hosts).length === 0) {
        await deleteRecord().catch(warnOnce)
      }
    },
    // a successful run leaves no record behind: strict, a record left on disk
    // would report the run as interrupted at the next restart
    delete: deleteOrSucceed,
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
