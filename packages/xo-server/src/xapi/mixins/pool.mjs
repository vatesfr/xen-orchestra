import { asyncEach } from '@vates/async-each'
import { cancelable, timeout } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { incorrectState } from 'xo-common/api-errors.js'
import { isHostRunning } from '../utils.mjs'
import { parseDateTime } from '@xen-orchestra/xapi'
// only used for its `signal` support, which pDelay does not have
import { setTimeout as sleep } from 'node:timers/promises'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import filter from 'lodash/filter.js'
import groupBy from 'lodash/groupBy.js'
import mapValues from 'lodash/mapValues.js'

const log = createLogger('xo:xapi')

const PATH_DB_DUMP = '/pool/xmldbdump'

// XAPI error codes identifying VMs that can never be evacuated because they use
// a host-bound device (PCI passthrough, vGPU, SR-IOV VIF): these VMs can only
// be handled by shutting them down before their host reboots and starting them
// again on it afterwards
const PINNED_VM_ERROR_CODES = new Set(['VM_HAS_PCI_ATTACHED', 'VM_HAS_VGPU', 'VM_HAS_SRIOV_VIF'])

// pinned VMs are shut down in parallel to keep the host's downtime short, but
// started back more conservatively to avoid a boot storm on a host which has
// just rebooted
const PINNED_VM_SHUTDOWN_CONCURRENCY = 8
const PINNED_VM_START_CONCURRENCY = 2

// TWINSTOR mirrors the SR between the two hosts of the pool: while a replica is
// catching up, a single host holds the only up-to-date copy of the data, so
// rebooting the other one takes the storage down under the running VMs.
// Rebooting is itself what starts the next resync, so this is what paces the
// whole run.
//
// The pool master republishes the replication state on the SR's `other_config`,
// and each host stamps its own daemon's liveness on its record. Both are
// heartbeats, rewritten every 60 seconds even when nothing changed, so XO never
// reads their value, only whether they moved since the state it last accepted:
// a host which just rebooted leaves the records frozen on the verdict which
// allowed its reboot, and dating them against XO's own clock would only work as
// well as the two clocks agree.
const TWINSTOR_POLL_INTERVAL = 10e3

// without its own bound a read would inherit the XAPI call timeout (an hour)
// and overrun the sync budget by that much
const TWINSTOR_READ_TIMEOUT = 60e3

// the daemon bumps it when the meaning of the keys changes, so a `synced` from
// an unknown one cannot be taken at face value
const TWINSTOR_SCHEMA = '1'

// uninstalling TWINSTOR destroys the SR and its keys, but leaves
// `twinstor-version` on the hosts forever: only the SR can tell whether a pool
// is still TWINSTOR-backed
const isTwinstorSr = ({ other_config: c }) => c?.['twinstor-managed'] === 'true' || c?.['twinstor-synced'] !== undefined
const isTwinstorHost = ({ other_config: c }) => c?.['twinstor-version'] !== undefined

const setProgress = (task, progress) => task.set('progress', Math.round(progress))

const methods = {
  exportPoolMetadata($cancelToken) {
    return this.getResource($cancelToken, PATH_DB_DUMP, {
      task: this.task_create('Export pool metadata'),
    }).then(response => response.body)
  },

  // Restore the XAPI database from an XML backup
  //
  // See https://github.com/xapi-project/xen-api/blob/405b02e72f1ccc4f4b456fd52db30876faddcdd8/ocaml/xapi/pool_db_backup.ml#L170-L205
  importPoolMetadata($cancelToken, stream, force = false) {
    return this.putResource($cancelToken, stream, PATH_DB_DUMP, {
      query: {
        dry_run: String(!force),
      },
      task: this.task_create('Import pool metadata'),
    })
  },

  // One read of everything the gate watches: the replication state each
  // TWINSTOR SR advertises, and the liveness stamp each host's daemon writes.
  //
  // Returns the stamps that were read and, when a host may not be rebooted
  // right now, what is holding it back.
  async _readTwinstor({ srRefs, hostRefs, stamps: previous }) {
    const readOtherConfig = (type, ref) => timeout.call(this.getField(type, ref, 'other_config'), TWINSTOR_READ_TIMEOUT)

    let srs, hosts
    try {
      ;[srs, hosts] = await Promise.all([
        Promise.all(srRefs.map(ref => readOtherConfig('SR', ref))),
        Promise.all(hostRefs.map(ref => readOtherConfig('host', ref))),
      ])
    } catch (error) {
      // the pool master may still be reconnecting after its own reboot: a state
      // which cannot be read is simply not a synced one
      log.warn('could not read the TWINSTOR state of the pool', { error })
      return { blockedBy: `the TWINSTOR state of the pool could not be read: ${error.message}` }
    }

    const stamps = [...srs.map(_ => _['twinstor-updated-at']), ...hosts.map(_ => _['twinstor-alive'])]
    // before the first accepted state there is nothing to compare against, so
    // the very first read only has to be synced
    const hasMoved = i => previous === undefined || (stamps[i] !== undefined && stamps[i] !== previous[i])

    for (let i = 0; i < srs.length; ++i) {
      const otherConfig = srs[i]

      const schema = otherConfig['twinstor-schema']
      if (schema !== undefined && schema !== TWINSTOR_SCHEMA) {
        // a state which cannot be read is worth retrying, one which cannot be
        // interpreted is not: waiting would only delay the same verdict
        throw new Error(`unsupported TWINSTOR schema ${JSON.stringify(schema)}, update XO to roll this pool`)
      }

      // the daemon republishes only the keys it believes changed, against a
      // cache which outlives a pool master change and cannot see an outside
      // edit of the record: requiring both to agree makes a divergence fail
      // closed
      const state = otherConfig['twinstor-storage-state']
      if (otherConfig['twinstor-synced'] !== 'true' || state !== 'synced') {
        // `Number('')` is 0, which would invent a 0% resync
        const progress = parseFloat(otherConfig['twinstor-sync-pct'])
        return {
          stamps,
          blockedBy: `${this.getObject(srRefs[i]).name_label} is ${state ?? 'in an unknown state'}`,
          progress: Number.isFinite(progress) ? progress : undefined,
        }
      }
      if (!hasMoved(i)) {
        return { stamps, blockedBy: 'TWINSTOR has not published its state since the last host rebooted' }
      }
    }

    for (let i = 0; i < hosts.length; ++i) {
      // DRBD keeps replicating in the kernel without the daemon, so the pair
      // can look perfectly healthy while a node has no supervision at all
      if (!hasMoved(srs.length + i)) {
        return { stamps, blockedBy: `the TWINSTOR daemon is not running on ${this.getObject(hostRefs[i]).name_label}` }
      }
    }

    return { stamps }
  },

  // Hold until both replicas are up to date again, and accept that state as the
  // one the next wait must differ from. Rebooting is what starts a resync, so on
  // every host but the first this waits for the previous reboot to have healed.
  //
  // `twinstorSyncTimeout` budgets the whole run rather than one wait, so it also
  // bounds how long the pool can be held with HA disabled.
  async _waitForTwinstorSync(gate, taskProperties) {
    if (gate === undefined) {
      return
    }

    const startedAt = Date.now()
    const deadline = startedAt + gate.timeLeft
    try {
      await Task.run({ properties: { ...taskProperties, progress: 0 } }, async () => {
        // the one step which can hold for hours, and the only one where the run
        // is waiting not to have rebooted anything yet
        const abortSignal = Task.abortSignal

        let result = await this._readTwinstor(gate)
        while (result.blockedBy !== undefined) {
          if (Date.now() >= deadline) {
            throw new Error(`TWINSTOR storage did not get back in sync in time (${result.blockedBy})`)
          }
          Task.set('twinstorState', result.blockedBy)
          Task.set('progress', Math.round(result.progress ?? 0))

          // an abort cuts the delay short, and is raised on the next line with
          // the run's own reason rather than as a generic AbortError
          await sleep(gate.pollInterval, undefined, { signal: abortSignal }).catch(() => {})
          abortSignal?.throwIfAborted()
          result = await this._readTwinstor(gate)
        }

        // the host about to reboot resyncs on its way back, so this state stops
        // being a verdict on the pool the moment it goes down. Nothing clears
        // the records, so requiring the next state to be a different one is
        // what makes this gate a barrier.
        gate.stamps = result.stamps
        Task.set('progress', 100)
      })
    } finally {
      // charged on every outcome: what the budget bounds is the time the pool
      // spends held, not whether the wait worked out
      gate.timeLeft = Math.max(0, gate.timeLeft - (Date.now() - startedAt))
    }
  },

  async rollingPoolReboot(
    $defer,
    parentTask,
    { beforeEvacuateVms, beforeRebootHost, ignoreHost, shutdownPinnedVms = false } = {}
  ) {
    const hosts = filter(this.objects.all, { $type: 'host' })

    // undefined on a pool without TWINSTOR, which disables the gate entirely.
    // Resolved once, while the whole pool is up and its records are all in
    // cache: re-scanning between reboots could miss an SR whose record has not
    // been repopulated yet, and silently turn the gate into a no-op.
    let twinstor
    const twinstorSrRefs = filter(this.objects.indexes.type.SR, isTwinstorSr).map(_ => _.$ref)
    if (twinstorSrRefs.length > 0) {
      log.info(
        `pool ${this.pool.uuid} is backed by TWINSTOR, hosts will be rebooted only while both replicas are synced`
      )
      twinstor = {
        srRefs: twinstorSrRefs,
        hostRefs: hosts.filter(isTwinstorHost).map(_ => _.$ref),
        // how much longer this run may spend waiting on the storage, in total
        timeLeft: this._twinstorSyncTimeout,
        pollInterval: TWINSTOR_POLL_INTERVAL,
      }
    }

    // held here, before HA, auto power on, the load balancer and the pool's
    // backup schedules are disabled: a pool whose storage is not redundant is
    // better left waiting with everything still enabled than held for hours
    // with everything off
    await this._waitForTwinstorSync(twinstor, { name: 'Waiting for TWINSTOR storage to be in sync' })

    if (this.pool.ha_enabled) {
      const haSrs = this.pool.$ha_statefiles.map(vdi => vdi.SR)
      const haConfig = this.pool.ha_configuration
      await this.call('pool.disable_ha')
      $defer(() => this.call('pool.enable_ha', haSrs, haConfig))
    }

    if (this.pool.other_config.auto_poweron === 'true') {
      log.info(`temporarily disabling auto power on during the rolling reboot of pool ${this.pool.uuid}`)
      await this.pool.update_other_config('auto_poweron', 'false')
      $defer(() => this.pool.update_other_config('auto_poweron', 'true'))
    }

    {
      const deadHost = hosts.find(_ => !isHostRunning(_))
      if (deadHost !== undefined) {
        // reflect the interface of an XO host object
        throw incorrectState({
          actual: 'Halted',
          expected: 'Running',
          object: deadHost.$id,
          property: 'power_state',
        })
      }
    }

    // when shutdownPinnedVms is enabled, pinned VMs will be shut down before
    // their host reboots and started again on it afterwards, otherwise their
    // UUIDs are collected to raise a single actionable error covering the
    // whole pool, any other evacuation blocker aborts the run
    //
    // this check requires HA to be already disabled: with HA enabled, XAPI
    // reports every non-protected VM as an evacuation blocker
    const unhandledPinnedVmUuids = []
    await Promise.all(
      hosts
        .filter(host => !ignoreHost || !ignoreHost(host))
        .map(async host => {
          const blockedVms = await host.$call('get_vms_which_prevent_evacuation')
          const vmRefs = Object.keys(blockedVms)
          if (vmRefs.length === 0) {
            return
          }

          const canHandleAllBlockers = Object.values(blockedVms).every(([errorCode]) =>
            PINNED_VM_ERROR_CODES.has(errorCode)
          )
          if (!canHandleAllBlockers) {
            // let XAPI raise its canonical CANNOT_EVACUATE_HOST error
            return host.$call('assert_can_evacuate')
          }

          if (!shutdownPinnedVms) {
            unhandledPinnedVmUuids.push(...vmRefs.map(vmRef => this.getObject(vmRef).uuid))
          }
        })
    )
    if (unhandledPinnedVmUuids.length > 0) {
      // the run can proceed if the caller consents to shut these VMs down
      // during their host's reboot, by enabling shutdownPinnedVms
      throw incorrectState({
        actual: unhandledPinnedVmUuids,
        expected: [],
        object: this.pool.uuid,
        property: 'pinnedVms',
      })
    }

    // VMs shut down for their host's reboot and not started again yet: if the
    // run aborts, leave them running rather than halted
    const haltedPinnedVms = new Map() // VM ref -> host ref
    $defer(async () => {
      for (const [vmRef, hostRef] of haltedPinnedVms) {
        try {
          await this.callAsync('VM.start_on', vmRef, hostRef, false, false)
        } catch (error) {
          log.warn('failed to restart pinned VM after an aborted rolling pool reboot', { vmRef, error })
        }
      }
    })

    // Steps in the RPR : Evacuate hosts, reboot hosts, migrate VMs back, and potentially updateHosts (beforeEvacuateVms and beforeRebootHost)
    const nSteps = 3 + Number(beforeEvacuateVms !== undefined) + Number(beforeRebootHost !== undefined)

    const progressStep = 100 / nSteps
    const progressStepPerHost = progressStep / hosts.length
    let rprProgress = 0

    if (beforeEvacuateVms) {
      await beforeEvacuateVms()
      rprProgress += progressStep
      setProgress(parentTask, rprProgress)
    }
    // Remember on which hosts the running VMs are
    const vmRefsByHost = mapValues(
      groupBy(
        filter(this.objects.all, {
          $type: 'VM',
          power_state: 'Running',
          is_control_domain: false,
        }),
        vm => {
          const hostId = vm.$resident_on?.$id

          if (hostId === undefined) {
            throw new Error('Could not find host of all running VMs')
          }

          return hostId
        }
      ),
      vms => vms.map(vm => vm.$ref)
    )

    // Put master in first position to restart it first
    const indexOfMaster = hosts.findIndex(host => host.$ref === this.pool.master)
    if (indexOfMaster === -1) {
      throw new Error('Could not find pool master')
    }
    ;[hosts[0], hosts[indexOfMaster]] = [hosts[indexOfMaster], hosts[0]]

    // Restart all the hosts one by one
    const restartSubtask = new Task({ properties: { name: `Restarting hosts`, progress: 0 } })
    await restartSubtask.run(async () => {
      const nStepsSubtask = 2 + Number(beforeRebootHost !== undefined)
      const subtaskProgressStep = 100 / (nStepsSubtask * hosts.length)
      let subtaskProgress = 0

      for (const host of hosts) {
        const hostId = host.uuid
        const hostName = host.name_label

        // the one point where stopping is free: the previous host is back up
        // and nothing has been done to this one yet. Not applied once a host is
        // on its way down, there is no un-rebooting it.
        Task.abortSignal?.throwIfAborted()

        if (!ignoreHost || !ignoreHost(host)) {
          await Task.run({ properties: { name: `Restarting host ${hostId}`, hostId, hostName } }, async () => {
            // This is an old metrics reference from before the pool master restart.
            // The references don't seem to change but it's not guaranteed.
            const metricsRef = host.metrics

            await this.barrier(metricsRef)
            await this._waitObjectState(metricsRef, metrics => metrics.live)

            // no point evacuating and patching a host which cannot then be
            // rebooted
            await this._waitForTwinstorSync(twinstor, {
              name: 'Waiting for TWINSTOR storage to be in sync before evacuating',
              objectId: hostId,
              hostId,
              hostName,
            })

            const getServerTime = async () => parseDateTime(await this.call('host.get_servertime', host.$ref)) * 1e3

            let pinnedVmRefs = []
            if (shutdownPinnedVms) {
              // fresh query instead of reusing the initial check: the pool
              // state may have changed while handling the previous hosts
              const blockedVms = await host.$call('get_vms_which_prevent_evacuation')
              pinnedVmRefs = Object.entries(blockedVms)
                .filter(([, [errorCode]]) => PINNED_VM_ERROR_CODES.has(errorCode))
                .map(([vmRef]) => vmRef)

              if (pinnedVmRefs.length > 0) {
                await Task.run({ properties: { name: `Shut down pinned VMs`, hostId, hostName } }, async () => {
                  await asyncEach(
                    pinnedVmRefs,
                    async vmRef => {
                      const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
                      await Task.run(
                        { properties: { name: `Shutting down VM ${vmId}`, hostId, hostName, vmId, vmName } },
                        async () => {
                          try {
                            // a guest may ignore the shutdown request: cancel it and force the shutdown
                            // instead of blocking the whole run, the user consented to these VMs going down
                            await timeout.call(this.callAsync('VM.clean_shutdown', vmRef), this._vmShutdownTimeout)
                          } catch (error) {
                            log.warn('clean shutdown of a pinned VM failed, forcing it', { vmId, error })
                            await this.callAsync('VM.hard_shutdown', vmRef)
                          }
                        }
                      )
                      haltedPinnedVms.set(vmRef, host.$ref)
                    },
                    { concurrency: PINNED_VM_SHUTDOWN_CONCURRENCY, stopOnError: true }
                  )
                })
              }
            }

            // the pool state may have changed since the initial check, e.g. while evacuating the previous hosts
            await Task.run({ properties: { name: `Check evacuation precondition`, hostId, hostName } }, async () => {
              await host.$call('assert_can_evacuate')
            })

            await Task.run({ properties: { name: `Evacuate`, hostId, hostName } }, async () => {
              await this.clearHost(host)
            })
            // clearHost leaves the host disabled and only the reboot below
            // re-enables it, so anything failing in between would leave it in
            // maintenance mode and take the pinned-VM restart down with it
            // (VM.start_on refuses a disabled host)
            $defer.onFailure(() => this.enableHost(hostId))
            rprProgress += progressStepPerHost
            setProgress(parentTask, rprProgress)
            subtaskProgress += subtaskProgressStep
            setProgress(restartSubtask, subtaskProgress)

            if (beforeRebootHost) {
              await beforeRebootHost(host)
              rprProgress += progressStepPerHost
              setProgress(parentTask, rprProgress)
              subtaskProgress += subtaskProgressStep
              setProgress(restartSubtask, subtaskProgress)
            }

            // evacuating and patching take long enough for the storage to have
            // lost its redundancy since the check above
            await this._waitForTwinstorSync(twinstor, {
              name: 'Waiting for TWINSTOR storage to be in sync before rebooting',
              objectId: hostId,
              hostId,
              hostName,
            })

            const rebootTime = await getServerTime()
            await Task.run({ properties: { name: `Restart`, hostId, hostName } }, async () => {
              await this.callAsync('host.reboot', host.$ref)
            })

            const waitingHostSubtask = new Task({
              properties: { name: `Waiting for host to be up`, objectId: hostId, hostId, hostName, progress: 0 },
            })
            await waitingHostSubtask.run(async () => {
              await timeout.call(
                (async () => {
                  await Task.run(
                    {
                      properties: {
                        name: 'Waiting for host to be enabled and agent to be up',
                        objectId: hostId,
                        hostId,
                        hostName,
                      },
                    },
                    async () => {
                      await this._waitObjectState(
                        hostId,
                        host => host.enabled && rebootTime < host.other_config.agent_start_time * 1e3
                      )
                    }
                  )

                  setProgress(waitingHostSubtask, 50)
                  await Task.run(
                    {
                      properties: { name: 'Waiting for host metrics to be live', objectId: hostId, hostId, hostName },
                    },
                    async () => {
                      await this._waitObjectState(metricsRef, metrics => metrics.live)
                    }
                  )
                  setProgress(waitingHostSubtask, 100)
                })(),
                this._restartHostTimeout,
                new Error(`Host ${hostId} took too long to restart`)
              )
            })

            if (pinnedVmRefs.length > 0) {
              await Task.run({ properties: { name: `Restart pinned VMs`, hostId, hostName } }, async () => {
                // stopOnError: still try to start every pinned VM of this host before failing the run
                await asyncEach(
                  pinnedVmRefs,
                  async vmRef => {
                    const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
                    await Task.run(
                      {
                        properties: { name: `Restarting VM ${vmId} on host ${hostId}`, hostId, hostName, vmId, vmName },
                      },
                      () => this.callAsync('VM.start_on', vmRef, host.$ref, false, false)
                    )
                    haltedPinnedVms.delete(vmRef)
                  },
                  { concurrency: PINNED_VM_START_CONCURRENCY, stopOnError: false }
                )
              })
            }
            rprProgress += progressStepPerHost
            setProgress(parentTask, rprProgress)
            subtaskProgress += subtaskProgressStep
            setProgress(restartSubtask, subtaskProgress)
          })
        } else {
          rprProgress += progressStepPerHost * nStepsSubtask
          setProgress(parentTask, rprProgress)
          subtaskProgress += subtaskProgressStep * nStepsSubtask
          setProgress(restartSubtask, subtaskProgress)
        }
      }
    })

    // Start with the last host since it's the emptiest one after the rolling
    // update
    ;[hosts[0], hosts[hosts.length - 1]] = [hosts[hosts.length - 1], hosts[0]]

    const migrationsSubtask = new Task({ properties: { name: `Migrate VMs back`, progress: 0 } })
    await migrationsSubtask.run(async () => {
      let done = 0
      let error
      for (const host of hosts) {
        const hostId = host.uuid
        const hostName = host.name_label
        if (ignoreHost && ignoreHost(host)) {
          done++
          setProgress(migrationsSubtask, (100 * done) / hosts.length)
          rprProgress += progressStepPerHost
          setProgress(parentTask, rprProgress)
          continue
        }

        const vmRefs = vmRefsByHost[hostId]

        if (vmRefs === undefined) {
          done++
          setProgress(migrationsSubtask, (100 * done) / hosts.length)
          rprProgress += progressStepPerHost
          setProgress(parentTask, rprProgress)
          continue
        }
        const oneHostMigrationsTask = new Task({
          properties: { name: `Migrating VMs back to host ${hostId}`, hostId, hostName, progress: 0 },
        })
        await oneHostMigrationsTask.run(async () => {
          // host.$resident_VMs is outdated and returns resident VMs before the host.evacuate.
          // this.getField is used in order not to get cached data.
          const residentVmRefs = await this.getField('host', host.$ref, 'resident_VMs')
          let done = 0

          for (const vmRef of vmRefs) {
            if (residentVmRefs.includes(vmRef)) {
              done++
              setProgress(oneHostMigrationsTask, (100 * done) / vmRefs.length)
              continue
            }

            try {
              const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
              await Task.run(
                {
                  properties: { name: `Migrating VM ${vmId} back to host ${hostId}`, hostId, hostName, vmId, vmName },
                },
                async () => {
                  await this.migrateVm(vmId, this, hostId)
                }
              )
            } catch (err) {
              if (error === undefined) {
                error = err
              }
            }
            done++
            setProgress(oneHostMigrationsTask, (100 * done) / vmRefs.length)
          }
        })
        done++
        setProgress(migrationsSubtask, (100 * done) / hosts.length)
        rprProgress += progressStepPerHost
        setProgress(parentTask, rprProgress)
      }
      // making the migration task fail if any of the migrations failed
      if (error !== undefined) {
        throw error
      }
    })
    // in case task progress has not been incremented properly
    setProgress(parentTask, 100)
  },
}

export default decorateObject(methods, {
  exportPoolMetadata: cancelable,
  importPoolMetadata: cancelable,
  rollingPoolReboot: deferrable.onError(log.warn),
})
