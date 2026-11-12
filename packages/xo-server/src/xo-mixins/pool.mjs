import difference from 'lodash/difference.js'
import flatten from 'lodash/flatten.js'
import isEmpty from 'lodash/isEmpty.js'
import keyBy from 'lodash/keyBy.js'
import semver from 'semver'
import some from 'lodash/some.js'
import stubTrue from 'lodash/stubTrue.js'
import uniq from 'lodash/uniq.js'
import { asyncEach } from '@vates/async-each'
import { createLogger } from '@xen-orchestra/log'
import { decorateMethodsWith } from '@vates/decorate-with'
import { defer } from 'golike-defer'
import { Task } from '@vates/task'
import { incorrectState } from 'xo-common/api-errors.js'

import { acquireRpuGuard } from '../_rpuGuard.mjs'
import { gcRpuTraces, getRpuTracesConfig, openRpuTrace, reconcileRpuTraces } from '../_rpuObservability.mjs'
import {
  createRpuRecoveryRecorder,
  listUnrestoredItems,
  readClosableRpuRecoveryRecord,
  readRpuRecoveryView,
  reconcileRpuRecoveryAtBoot,
  resumeRpuRecoveryRun as resumeRpuRecoveryRunInStore,
  startRpuRecoveryRun as startRpuRecoveryRunInStore,
} from '../_rpuRecovery.mjs'

const log = createLogger('xo:xo-mixins:pool')

async function enforceHostsHaveLicense($defer, app, productType, hostIds) {
  const now = Date.now()
  const licenses = await app.getLicenses({ productType })
  const licenseByBoundObjectId = keyBy(licenses, 'boundObjectId')
  const hostIdsWithoutLicense = hostIds.filter(id => {
    const license = licenseByBoundObjectId[id]
    return license === undefined || (license.expires !== undefined && license.expires < now)
  })

  if (hostIdsWithoutLicense > 0) {
    const nNewHosts = hostIdsWithoutLicense.length
    const availableLicenses = licenses.filter(
      ({ boundObjectId, expires }) => boundObjectId === undefined && (expires === undefined || expires > now)
    )
    const nAvailableLicenses = availableLicenses.length
    if (nNewHosts > nAvailableLicenses) {
      throw new Error(
        `Not enough ${productType.toUpperCase()} Licenses. Expected: ${nNewHosts}, actual: ${nAvailableLicenses}`
      )
    }

    await asyncEach(
      hostIdsWithoutLicense,
      async hostId => {
        const license = availableLicenses.pop()
        await app.bindLicense({
          licenseId: license.id,
          boundObjectId: hostId,
        })
        $defer.onFailure(() =>
          app.unbindLicense({ licenseId: license.id, productId: license.productId, boundObjectId: hostId })
        )
      },
      {
        stopOnError: false,
      }
    )
  }
}

export default class Pools {
  constructor(app) {
    this._app = app

    const gc = () => {
      const { dir, retention } = getRpuTracesConfig(app)
      return gcRpuTraces(dir, retention)
    }
    app.hooks.on('clean', gc)
    // the clean hook only runs at startup and on manual xo.clean: also enforce
    // the retention periodically (same pattern as xo-mixins/logs)
    setInterval(gc, 6 * 60 * 60 * 1000).unref()

    // a heartbeat left pending on disk after a restart belongs to an
    // interrupted run: stamp it so the disk alone is unambiguous
    app.hooks.on('start', () => reconcileRpuTraces(getRpuTracesConfig(app).dir))

    // a recovery record left in a live status belongs to a run killed by the
    // restart: flip it to `interrupted` before serving any client
    let resolveAutoResumePoolIds
    const autoResumePoolIdsLoaded = new Promise(resolve => {
      resolveAutoResumePoolIds = resolve
    })
    app.hooks.on('start', async () => {
      let autoResumePoolIds = []
      try {
        this._rpuRecoveryStore = await app.getStore('rpuRecovery')
        autoResumePoolIds = await reconcileRpuRecoveryAtBoot(this._rpuRecoveryStore)
      } finally {
        // a failed start resumes nothing, it must not hold the connections
        resolveAutoResumePoolIds(new Set(autoResumePoolIds))
      }
    })

    // a run this restart interrupted resumes once its pool is connected again,
    // a single time: the pool is dropped from the set before the resume starts.
    // A connection may come before the records are loaded, the start hooks run
    // concurrently: it waits for them
    app.on('server:connected', async ({ xapi }) => {
      const poolId = xapi.pool.$id
      if ((await autoResumePoolIdsLoaded).delete(poolId)) {
        await this._autoResumeRollingPoolUpdate(poolId)
      }
    })
  }

  // never throws: called from an event listener
  async _autoResumeRollingPoolUpdate(poolId) {
    const app = this._app
    log.info('resuming the rolling pool update interrupted by the restart of xo-server', { poolId })
    try {
      // the pool may have been reconnected by an API call (`server.enable`),
      // whose user neither owns the run nor lends it their credentials
      await app.runWithoutApiContext(() =>
        app.resumeRollingPoolUpdate(app.getObject(poolId, 'pool'), { automatic: true })
      )
    } catch (error) {
      // a refusal (license, backup, missing pool...) leaves the run interrupted,
      // operator changes leave it awaiting acceptance
      log.warn('automatic resume of the rolling pool update failed, it waits for a manual resume', { error, poolId })
    }
  }

  startRpuRecoveryRun(poolId, options) {
    return startRpuRecoveryRunInStore({ store: this._rpuRecoveryStore, poolId, options })
  }

  /**
   * Continues the failed or interrupted run of a pool, see `resumeRpuRecoveryRun` in `_rpuRecovery.mjs`.
   *
   * @param {object} pool - XO pool object
   * @param {object[]} schedules - all the backup schedules (`getAllSchedules`), the caller already reads them
   * @param {object} [opts]
   * @param {boolean} [opts.acceptOperatorChanges] - take what an operator changed since the run as the new baseline
   * @param {boolean} [opts.automatic] - Whether xo-server started this attempt after a restart, without the operator
   * @returns {Promise<object>} the recorder, the options of the run, what the previous attempts did, the
   *   settings they left changed included (see `planRpuResume`), and the operator changes accepted
   */
  async resumeRpuRecoveryRun(pool, schedules, { acceptOperatorChanges = false, automatic = false } = {}) {
    const xapi = this._app.getXapi(pool)
    const scheduleById = keyBy(schedules, 'id')
    const { recorder, record, plan, acceptedOperatorChanges } = await resumeRpuRecoveryRunInStore({
      store: this._rpuRecoveryStore,
      poolId: pool.id,
      live: {
        pool: xapi.pool,
        getHost: hostId => xapi.getObjectByUuid(hostId, undefined),
        getSchedule: scheduleId => scheduleById[scheduleId],
        getSr: srId => xapi.getObjectByUuid(srId, undefined),
        getVm: vmId => xapi.getObjectByUuid(vmId, undefined),
      },
      acceptOperatorChanges,
      automatic,
    })
    return { recorder, options: record.options, resume: plan, acceptedOperatorChanges }
  }

  getRollingUpdateRecovery(poolId) {
    return readRpuRecoveryView(this._rpuRecoveryStore, poolId)
  }

  // compared with the live state: what the operator restored by hand is not listed
  async _listUnrestoredRpuItems(pool, record) {
    const xapi = this._app.getXapi(pool)
    const [plugin, schedules] = await Promise.all([
      this._app.getOptionalPlugin('load-balancer'),
      this._app.getAllSchedules(),
    ])
    const scheduleById = keyBy(schedules, 'id')
    return listUnrestoredItems(record, {
      pool: xapi.pool,
      // unloaded but waiting for xo-server to load it again is not left changed
      loadBalancerLoaded: plugin?.loaded === true || this._app.isRpuLoadBalancerReEnablePending(),
      getHost: hostId => xapi.getObjectByUuid(hostId, undefined),
      getVm: vmId => xapi.getObjectByUuid(vmId, undefined),
      getSchedule: scheduleId => scheduleById[scheduleId],
    })
  }

  /**
   * Closes the recovery record a previous rolling pool update left on the pool.
   *
   * What the run left unrestored is first restored, best effort (see
   * `restoreRpuLeftovers`): hosts enabled, pinned VMs started, VMs migrated
   * back to their home host, settings enabled again. The record is deleted
   * once nothing is left. Otherwise it is kept, without what was restored, and
   * the finalization is refused with what is left.
   *
   * With `force`, nothing is restored nor changed in the pool: the items are
   * abandoned, listed in the task and the trace, and the record is deleted.
   *
   * @param {object} pool - XO pool object
   * @param {object} [opts]
   * @param {boolean} [opts.force] - Close even though items are left unrestored or the record cannot be read
   * @param {Task} [opts.parentTask] - Run as a subtask of this task instead of as a new root task
   * @returns {Promise<void>}
   * @throws {Error} `noSuchObject` if the pool has no record
   * @throws {Error} `forbiddenOperation` if a rolling pool update or reboot is running on the pool, or if a backup
   *   runs or may run on it while something is left to restore and `force` is not set
   * @throws {Error} `incorrectState` (property `status`) if the record belongs to a live run
   * @throws {Error} `incorrectState` (property `unrestoredItems`, `actual` the items, `null` when the record cannot
   *   be read) if something could not be restored and `force` is not set
   */
  async finalizeRollingUpdate(pool, { force = false, parentTask } = {}) {
    const { _app } = this
    const poolId = pool.id
    const store = this._rpuRecoveryStore
    const releaseGuard = acquireRpuGuard(poolId, 'finalizeRollingUpdate')
    try {
      const record = await readClosableRpuRecoveryRecord(store, poolId)

      const unrestoredItems = await this._listUnrestoredRpuItems(pool, record)
      const refuse = items => {
        throw incorrectState({ actual: items, expected: [], object: poolId, property: 'unrestoredItems' })
      }
      // nothing can be restored from a record which cannot be read
      if (unrestoredItems === null && !force) {
        refuse(unrestoredItems)
      }
      // the cleanup migrates VMs
      if (!force && unrestoredItems.length > 0) {
        await _app.backupGuard(poolId, { operation: 'finalizeRollingUpdate' })
      }

      const runId = record?.runId
      const trace = openRpuTrace({ dir: getRpuTracesConfig(_app).dir, kind: 'rpu-finalize', poolId })
      if (trace !== undefined) {
        log.info(`finalization of the rolling pool update of pool ${poolId}: trace in ${trace.traceFile}`)
      }
      try {
        const properties = {
          name: 'Finalize rolling pool update',
          objectId: poolId,
          poolId,
          poolName: pool.name_label,
          type: 'pool.rolling_update_finalize',
          runId,
          force,
          unrestoredItems,
          ...(trace !== undefined && { traceFile: trace.traceFile }),
        }
        const task = parentTask === undefined ? _app.tasks.create(properties) : new Task({ properties })
        trace?.attach(task)
        await task.run(async () => {
          if (unrestoredItems === null || unrestoredItems.length > 0) {
            if (force) {
              log.warn(`rolling pool update of pool ${poolId} finalized by force, nothing restored`, {
                poolId,
                runId,
                unrestoredItems,
              })
            } else {
              const recorder = createRpuRecoveryRecorder({ store, record })
              await _app.restoreRpuLeftovers(pool, { record, items: unrestoredItems, recorder })
              // a write still pending would bring a deleted record back
              await recorder.flush()
              const itemsLeft = await this._listUnrestoredRpuItems(pool, record)
              if (itemsLeft.length > 0) {
                refuse(itemsLeft)
              }
            }
          }
          await store.del(poolId)
        })
      } finally {
        trace?.stop()
      }
    } finally {
      releaseGuard()
    }
  }

  async mergeInto($defer, { sources: sourceIds, target, force }) {
    const { _app } = this
    const targetHost = _app.getObject(target.master)
    const sources = []
    const sourcePatches = {}

    // Check hosts compatibility.
    for (const sourceId of sourceIds) {
      const source = _app.getObject(sourceId)
      const sourceHost = _app.getObject(source.master)
      if (sourceHost.productBrand !== targetHost.productBrand) {
        throw new Error(`a ${sourceHost.productBrand} pool cannot be merged into a ${targetHost.productBrand} pool`)
      }
      if (sourceHost.version !== targetHost.version) {
        throw new Error('The hosts are not compatible')
      }
      sources.push(source)
      sourcePatches[sourceId] = sourceHost.patches
    }

    const hasLinstorSr = some(_app.objects.all, { SR_type: 'linstor', $pool: target.uuid })
    if (hasLinstorSr) {
      await enforceHostsHaveLicense($defer, _app, 'xostor', sourceIds)
    }

    // Find missing patches on the target.
    const targetRequiredPatches = uniq(
      flatten(await Promise.all(sources.map(({ master }) => _app.getPatchesDifference(master, target.master))))
    )

    // Find missing patches on the sources.
    const allRequiredPatches = targetRequiredPatches.concat(
      targetHost.patches.map(patchId => _app.getObject(patchId).name)
    )
    const sourceRequiredPatches = {}
    for (const sourceId of sourceIds) {
      const _sourcePatches = sourcePatches[sourceId].map(patchId => _app.getObject(patchId).name)
      const requiredPatches = difference(allRequiredPatches, _sourcePatches)
      if (requiredPatches.length > 0) {
        sourceRequiredPatches[sourceId] = requiredPatches
      }
    }

    // On XCP-ng, "installPatches" installs *all* the patches
    // whatever the patches argument is.
    // So we must not call it if there are no patches to install.
    if (targetRequiredPatches.length > 0 || !isEmpty(sourceRequiredPatches)) {
      // Find patches in parallel.
      const findPatchesPromises = []
      const sourceXapis = {}
      const targetXapi = _app.getXapi(target)
      for (const sourceId of sourceIds) {
        const sourceXapi = (sourceXapis[sourceId] = _app.getXapi(sourceId))
        findPatchesPromises.push(sourceXapi.findPatches(sourceRequiredPatches[sourceId] ?? []))
      }
      const patchesName = await Promise.all([targetXapi.findPatches(targetRequiredPatches), ...findPatchesPromises])

      const { xsCredentials } = _app.apiContext.user.preferences

      // Install patches in parallel.
      const installPatchesPromises = []
      installPatchesPromises.push(
        targetXapi.installPatches({
          patches: patchesName[0],
          xsCredentials,
        })
      )
      let i = 1
      for (const sourceId of sourceIds) {
        installPatchesPromises.push(
          sourceXapis[sourceId].installPatches({
            patches: patchesName[i++],
            xsCredentials,
          })
        )
      }

      await Promise.all(installPatchesPromises)
    }

    // Merge the sources into the target sequentially to be safe.
    for (const source of sources) {
      await _app.mergeXenPools(source._xapiId, target._xapiId, force)
    }
  }

  async listPoolsMatchingCriteria({
    minAvailableHostMemory = 0,
    minAvailableSrSize = 0,
    minHostCpus = 0,
    minHostVersion,
    poolNameRegExp,
    srNameRegExp,
  }) {
    const hostsByPool = {}
    const srsByPool = {}
    const pools = []
    for (const obj of this._app.objects.values()) {
      if (obj.type === 'host') {
        if (hostsByPool[obj.$pool] === undefined) {
          hostsByPool[obj.$pool] = []
        }
        hostsByPool[obj.$pool].push(obj)
      } else if (obj.type === 'SR') {
        if (srsByPool[obj.$pool] === undefined) {
          srsByPool[obj.$pool] = []
        }
        srsByPool[obj.$pool].push(obj)
      } else if (obj.type === 'pool') {
        pools.push(obj)
      }
    }

    const checkPoolName =
      poolNameRegExp === undefined ? stubTrue : RegExp.prototype.test.bind(new RegExp(poolNameRegExp))
    const checkSrName = srNameRegExp === undefined ? stubTrue : RegExp.prototype.test.bind(new RegExp(srNameRegExp))

    return pools.filter(
      pool =>
        checkPoolName(pool.name_label) &&
        hostsByPool[pool.id].some(
          host =>
            (minHostVersion === undefined || semver.satisfies(host.version, `>=${minHostVersion}`)) &&
            host.cpus.cores >= minHostCpus &&
            host.memory.size - host.memory.usage >= minAvailableHostMemory
        ) &&
        srsByPool[pool.id].some(sr => sr.size - sr.physical_usage >= minAvailableSrSize && checkSrName(sr.name_label))
    )
  }

  /**
   * Reboots the hosts of the pool one at a time.
   *
   * @param {object} pool - XO pool object
   * @param {object} [opts]
   * @param {boolean} [opts.bypassBackupCheck] - Skip the backup guard, the bypass is logged
   * @param {Task} [opts.parentTask] - Run as a subtask of this task instead of as a new root task
   * @param {boolean} [opts.shutdownPinnedVms] - Shut down the VMs that cannot be migrated before their host reboots
   * @throws {Error} `forbiddenOperation` if a backup runs or may run on the pool
   */
  async rollingPoolReboot(pool, { bypassBackupCheck, parentTask, shutdownPinnedVms } = {}) {
    const { _app } = this
    await _app.checkFeatureAuthorization('ROLLING_POOL_REBOOT')
    await _app.backupGuard(pool.id, { bypassBackupCheck, operation: 'rollingPoolReboot' })
    const releaseGuard = acquireRpuGuard(pool.id, 'rollingPoolReboot')
    const trace = openRpuTrace({ dir: getRpuTracesConfig(_app).dir, kind: 'rpr', poolId: pool.id })
    try {
      if (trace !== undefined) {
        log.info(`rolling pool reboot of pool ${pool.id}: trace in ${trace.traceFile}`)
      }

      const properties = {
        name: 'Rolling pool reboot',
        objectId: pool.id,
        poolId: pool.id,
        poolName: pool.name_label,
        progress: 0,
        type: 'pool.rolling_reboot',
        ...(trace !== undefined && { traceFile: trace.traceFile }),
      }
      const task = parentTask === undefined ? _app.tasks.create(properties) : new Task({ properties })
      trace?.attach(task)
      await task.run(async () => _app.getXapi(pool).rollingPoolReboot(task, { shutdownPinnedVms }))
    } finally {
      trace?.stop()
      releaseGuard()
    }
  }
}

decorateMethodsWith(Pools, {
  mergeInto: defer,
})
