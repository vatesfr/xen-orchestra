import { createLogger } from '@xen-orchestra/log'
import { randomUUID } from 'node:crypto'
import stringify from 'json-stringify-safe'

import { replacer } from './_rpuObservability.mjs'

const log = createLogger('xo:rpu-recovery')

export const RPU_RECOVERY_SCHEMA_VERSION = 1

// a run in one of these statuses cannot survive a process death: it is flipped
// to `interrupted` at boot
const LIVE_RUN_STATUSES = new Set(['preparing', 'running', 'resuming', 'cleaning'])

const STEP_NAMES = ['evacuate', 'update', 'reboot', 'enable', 'restoreVms']

const noop = () => {}
const asyncNoop = async () => {}

/**
 * Serializes an error through the RPU observability replacer: secret-looking
 * keys are scrubbed and the result only contains JSON-safe values.
 *
 * @param {any} error
 * @returns {any} JSON-safe representation, `null` for nullish errors
 */
export function filterError(error) {
  return error == null ? null : JSON.parse(stringify(error, replacer))
}

/**
 * Creates the initial `version 1` recovery record of an RPU run: status
 * `preparing`, nothing done yet.
 *
 * `conflicts`, `planChanges`, `original` and `changedByRun` are declared but
 * left empty: they are filled by the conflict detection and settings
 * restoration work built on top of this record.
 *
 * @param {object} params
 * @param {string} params.poolId
 * @param {object} params.options - Operator-consented options (`rebootVm`,
 *   `bypassBackupCheck`, `shutdownPinnedVms`), impossible to reconstruct later
 * @returns {object}
 */
export function createRpuRecoveryRecord({ poolId, options }) {
  const now = new Date().toISOString()
  return {
    schemaVersion: RPU_RECOVERY_SCHEMA_VERSION,
    runId: randomUUID(),
    poolId,
    status: 'preparing',
    attempt: 1,
    startedAt: now,
    updatedAt: now,
    options,
    hosts: {},
    haltedPinnedVms: {},
    lastError: null,
    conflicts: [],
    planChanges: [],
    original: {},
    changedByRun: [],
  }
}

function deriveHostStatus(steps) {
  const statuses = STEP_NAMES.map(name => steps[name]?.status ?? 'pending')
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
 * dates, current task, per-host steps, conflicts, plan changes, last filtered
 * error and halted pinned VMs.
 *
 * Never exposes the raw intent: options, initial VM placement, original
 * settings and agent times stay in the record.
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
    for (const name of STEP_NAMES) {
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
    attempt: record.attempt,
    startedAt: record.startedAt,
    updatedAt: record.updatedAt,
    finishedAt: record.finishedAt,
    interruptedAt: record.interruptedAt,
    taskId: record.taskId,
    variant: record.variant,
    hostOrder: record.hostOrder,
    hosts,
    conflicts: record.conflicts ?? [],
    planChanges: record.planChanges ?? [],
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
 * Recorder used when a run does not track recovery (rolling pool reboot):
 * every method is a no-op.
 */
export const noopRpuRecorder = Object.freeze({
  markRunning: noop,
  setTaskId: noop,
  setVariant: noop,
  setPatchInventory: noop,
  setVmHome: noop,
  setHostOrder: noop,
  hostStarting: noop,
  hostSkipped: noop,
  hostFailed: noop,
  stepRunning: noop,
  stepObserved: noop,
  stepNotNeeded: noop,
  stepFailed: noop,
  recordHaltedPinnedVm: asyncNoop,
  forgetHaltedPinnedVm: noop,
  fail: asyncNoop,
  delete: asyncNoop,
})

/**
 * Creates the recorder tracking one RPU run into its recovery record.
 *
 * Intent writes are strict (`recordHaltedPinnedVm` rejects on write failure so
 * the run aborts before the corresponding side effect), tracking writes are
 * best effort (a write failure is logged once, the run goes on). Writes are
 * chained so they reach the store in order.
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
    setVmHome(vmHomeById) {
      record.vmHomeById = vmHomeById
      write()
    },
    setHostOrder(hostIds) {
      record.hostOrder = hostIds
      write()
    },
    hostStarting(hostId, agentStartTime) {
      hostEntry(hostId).agentStartedAtBeforeUpdate = agentStartTime
      write()
    },
    hostSkipped(hostId) {
      for (const name of STEP_NAMES) {
        setStep(hostId, name, { status: 'not-needed' })
      }
      write()
    },
    // marks the step being run on this host as failed, if any: single failure
    // path for everything thrown while handling one host
    hostFailed(hostId, error) {
      const steps = hostEntry(hostId).steps
      const runningStep = STEP_NAMES.find(name => steps[name]?.status === 'running')
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
    // a successful run leaves no record behind
    async delete() {
      await chain
      try {
        await store.del(record.poolId)
      } catch (error) {
        log.warn('failed to delete the RPU recovery record after a successful run', { error, poolId: record.poolId })
      }
    },
  }
}

/**
 * Creates and persists the recovery record of a new RPU run, then returns its
 * recorder.
 *
 * Strict write: a failure rejects and must abort the RPU before any side
 * effect. An existing record for this pool is overwritten: refusing would
 * deadlock the pool as long as there is no explicit close operation.
 *
 * @param {object} params
 * @param {object} params.store - LevelDB sublevel, keyed by pool id
 * @param {string} params.poolId
 * @param {object} params.options
 * @returns {Promise<object>} the recorder
 */
export async function startRpuRecoveryRun({ store, poolId, options }) {
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
    for await (const poolId of store.createKeyStream()) {
      try {
        const record = await store.get(poolId)
        if (record?.schemaVersion === RPU_RECOVERY_SCHEMA_VERSION && LIVE_RUN_STATUSES.has(record.status)) {
          record.interruptedAt = record.updatedAt
          record.status = 'interrupted'
          record.updatedAt = new Date().toISOString()
          await store.put(poolId, record)
          log.info(`interrupted rolling pool update detected on pool ${record.poolId}`)
        }
      } catch (error) {
        log.warn('could not reconcile an RPU recovery record, it will be reported as blocked', { error, poolId })
      }
    }
  } catch (error) {
    log.warn('could not list the RPU recovery records for reconciliation', { error })
  }
}
