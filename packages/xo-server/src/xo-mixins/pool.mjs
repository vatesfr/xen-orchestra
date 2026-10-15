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
  listUnrestoredItems,
  readClosableRpuRecoveryRecord,
  readRpuRecoveryView,
  reconcileRpuRecoveryAtBoot,
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
    app.hooks.on('start', async () => {
      this._rpuRecoveryStore = await app.getStore('rpuRecovery')
      await reconcileRpuRecoveryAtBoot(this._rpuRecoveryStore)
    })
  }

  startRpuRecoveryRun(poolId, options) {
    return startRpuRecoveryRunInStore({ store: this._rpuRecoveryStore, poolId, options })
  }

  getRollingUpdateRecovery(poolId) {
    return readRpuRecoveryView(this._rpuRecoveryStore, poolId)
  }

  /**
   * Closes the recovery record a previous rolling pool update left on the pool.
   *
   * Refused while the run left something unrestored, unless `force` is set:
   * the items are then abandoned, listed in the task and the trace, and
   * nothing is restored nor changed in the pool. VMs away from their home host
   * alone do not refuse it, they are only listed in the task.
   *
   * @param {object} pool - XO pool object
   * @param {object} [opts]
   * @param {boolean} [opts.force] - Close even though items are left unrestored or the record cannot be read
   * @param {Task} [opts.parentTask] - Run as a subtask of this task instead of as a new root task
   * @returns {Promise<void>}
   * @throws {Error} `noSuchObject` if the pool has no record
   * @throws {Error} `forbiddenOperation` if a rolling pool update or reboot is running on the pool
   * @throws {Error} `incorrectState` (property `status`) if the record belongs to a live run
   * @throws {Error} `incorrectState` (property `unrestoredItems`, `actual` the items, `null` when the record cannot
   *   be read) if something is left unrestored and `force` is not set
   */
  async finalizeRollingUpdate(pool, { force = false, parentTask } = {}) {
    const { _app } = this
    const poolId = pool.id
    const store = this._rpuRecoveryStore
    const releaseGuard = acquireRpuGuard(poolId, 'finalizeRollingUpdate')
    try {
      const record = await readClosableRpuRecoveryRecord(store, poolId)

      const xapi = _app.getXapi(pool)
      const [plugin, schedules] = await Promise.all([_app.getOptionalPlugin('load-balancer'), _app.getAllSchedules()])
      const scheduleById = keyBy(schedules, 'id')
      const unrestoredItems = listUnrestoredItems(record, {
        pool: xapi.pool,
        loadBalancerLoaded: plugin?.loaded === true,
        getHost: hostId => xapi.getObjectByUuid(hostId, undefined),
        getVm: vmId => xapi.getObjectByUuid(vmId, undefined),
        getSchedule: scheduleId => scheduleById[scheduleId],
      })
      // a VM away from its home host does not block: it may have been moved on
      // purpose, and the next run takes the current placement as its home
      const abandonsItems = unrestoredItems === null || unrestoredItems.some(item => item.type !== 'vm')
      if (abandonsItems && !force) {
        throw incorrectState({ actual: unrestoredItems, expected: [], object: poolId, property: 'unrestoredItems' })
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
          if (abandonsItems) {
            log.warn(`rolling pool update of pool ${poolId} finalized by force, nothing restored`, {
              poolId,
              runId,
              unrestoredItems,
            })
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
