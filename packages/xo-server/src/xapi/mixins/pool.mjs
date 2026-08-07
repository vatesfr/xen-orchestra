import { asyncEach } from '@vates/async-each'
import { cancelable, timeout } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import {
  describeTwinstorState,
  isTwinstorDaemonAlive,
  isTwinstorHost,
  isTwinstorSr,
  parseTwinstorSrState,
} from '../_twinstor.mjs'
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

const TWINSTOR_POLL_INTERVAL = 10e3

// without its own bound a read would inherit the XAPI call timeout (an hour)
// and overrun the sync budget by that much
const TWINSTOR_PROBE_TIMEOUT = 60e3

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

  // One read of the pool's TWINSTOR advertisement: whether a host may be
  // rebooted right now, and if not, what is holding it back.
  async _probeTwinstor({ srRefs, hostRefs, publishedBefore }) {
    const now = Date.now()

    let srOtherConfigs, hostOtherConfigs
    try {
      ;[srOtherConfigs, hostOtherConfigs] = await Promise.all([
        Promise.all(srRefs.map(ref => timeout.call(this.getField('SR', ref, 'other_config'), TWINSTOR_PROBE_TIMEOUT))),
        Promise.all(
          hostRefs.map(ref => timeout.call(this.getField('host', ref, 'other_config'), TWINSTOR_PROBE_TIMEOUT))
        ),
      ])
    } catch (error) {
      // the pool master may still be reconnecting after its own reboot: an
      // unreadable advertisement is simply not a synced one
      log.warn('could not read the TWINSTOR state of the pool', { error })
      return { isReady: false, blockedBy: `the TWINSTOR state of the pool could not be read: ${error.message}` }
    }

    const states = srOtherConfigs.map(otherConfig => parseTwinstorSrState(otherConfig, { now }))

    // an advertisement which cannot be read is worth retrying, one which cannot
    // be interpreted is not: waiting would only delay the same verdict
    const incompatible = states.find(_ => !_.isSchemaSupported)
    if (incompatible !== undefined) {
      throw new Error(`unsupported TWINSTOR schema ${JSON.stringify(incompatible.schema)}, update XO to roll this pool`)
    }

    // see isTwinstorDaemonAlive: DRBD keeps replicating without the daemon
    const iDown = hostOtherConfigs.findIndex(otherConfig => !isTwinstorDaemonAlive(otherConfig, { now }))
    if (iDown !== -1) {
      return {
        isReady: false,
        blockedBy: `the TWINSTOR daemon is not running on ${this.getObject(hostRefs[iDown]).name_label}`,
      }
    }

    const iBlocked = states.findIndex((state, i) => {
      const before = publishedBefore.get(srRefs[i])
      return !state.isSynced || (before !== undefined && state.updatedAt <= before)
    })
    if (iBlocked !== -1) {
      const state = states[iBlocked]
      return {
        isReady: false,
        blockedBy: state.isSynced
          ? 'TWINSTOR has not published its state since the last host rebooted'
          : describeTwinstorState(state, { now }),
        // a stale advertisement carries a stale percentage, most likely the
        // 100% which preceded a reboot
        progress: state.isStale ? undefined : state.progress,
      }
    }

    return { isReady: true, published: new Map(srRefs.map((ref, i) => [ref, states[i].updatedAt])) }
  },

  // Refuse a run upfront rather than once HA, auto power on, the load balancer
  // and the pool's backup schedules have been disabled. Waiting is only
  // legitimate later on, when the resync being waited on is one the run caused.
  async _assertTwinstorReady(twinstor) {
    if (twinstor.srRefs.length === 0) {
      return
    }
    const { isReady, blockedBy } = await this._probeTwinstor(twinstor)
    if (!isReady) {
      throw incorrectState({
        actual: blockedBy,
        expected: 'synced',
        object: this.pool.uuid,
        property: 'twinstorStorageState',
      })
    }
  },

  // A host may only be rebooted while both replicas are up to date: during a
  // resync a single host holds the only complete copy of the data. Rebooting is
  // itself what starts the next resync, so this is the step which paces the
  // whole run. Returns the advertisement it accepted, which the caller records
  // before rebooting so the next host is not waved through on a stale one.
  //
  // `twinstorSyncTimeout` budgets the whole run rather than one wait, so it also
  // bounds how long the pool can be held with HA disabled.
  async _waitForTwinstorSync(twinstor, taskProperties) {
    if (twinstor.srRefs.length === 0) {
      return new Map()
    }

    // by far the common case, on every host but the ones following a reboot:
    // report nothing rather than adding an instantly resolved task per host
    const first = await this._probeTwinstor(twinstor)
    if (first.isReady) {
      return first.published
    }

    const task = new Task({ properties: { ...taskProperties, progress: 0 } })
    const startedAt = Date.now()
    const deadline = startedAt + twinstor.syncTimeLeft
    try {
      return await task.run(async () => {
        // the one step which can hold for hours, and the only one where the run
        // is waiting not to have rebooted anything yet
        const abortSignal = Task.abortSignal

        let probe = first
        while (!probe.isReady && Date.now() < deadline) {
          abortSignal?.throwIfAborted()
          task.set('twinstorState', probe.blockedBy)
          setProgress(task, probe.progress ?? 0)

          // an abort cuts the delay short, and is raised on the next line with
          // the run's own reason rather than as a generic AbortError
          await sleep(twinstor.pollInterval, undefined, { signal: abortSignal }).catch(() => {})
          abortSignal?.throwIfAborted()
          probe = await this._probeTwinstor(twinstor)
        }

        if (!probe.isReady) {
          throw new Error(`TWINSTOR storage did not get back in sync in time (${probe.blockedBy})`)
        }
        setProgress(task, 100)
        return probe.published
      })
    } finally {
      // charged on every outcome: what the budget bounds is the time the pool
      // spends held, not whether the wait worked out
      twinstor.syncTimeLeft = Math.max(0, twinstor.syncTimeLeft - (Date.now() - startedAt))
    }
  },

  async rollingPoolReboot(
    $defer,
    parentTask,
    { beforeEvacuateVms, beforeRebootHost, ignoreHost, shutdownPinnedVms = false } = {}
  ) {
    const hosts = filter(this.objects.all, { $type: 'host' })

    // resolved once, while the whole pool is up and its records are all in
    // cache: re-scanning between reboots could miss an SR whose record has not
    // been repopulated yet, and silently turn the gate into a no-op
    const twinstor = {
      srRefs: filter(this.objects.indexes.type.SR, sr => isTwinstorSr(sr.other_config)).map(sr => sr.$ref),
      hostRefs: hosts.filter(host => isTwinstorHost(host.other_config)).map(host => host.$ref),
      // what each SR had published when the last host was rebooted, which the
      // next advertisement must be newer than to be believed
      publishedBefore: new Map(),
      // how much longer this run may spend waiting on the storage, in total
      syncTimeLeft: this._twinstorSyncTimeout,
      pollInterval: TWINSTOR_POLL_INTERVAL,
    }
    if (twinstor.srRefs.length > 0) {
      log.info(
        `pool ${this.pool.uuid} is backed by TWINSTOR, hosts will be rebooted only while both replicas are synced`
      )
    } else {
      // a daemon stamping its liveness right now, on a pool where no SR
      // advertises, means the gate has no signal rather than that this is an
      // ordinary pool. A host which merely used to run TWINSTOR does not trip
      // this: an uninstall stops the daemon, which clears the stamp.
      const liveHost = hosts.find(host => isTwinstorDaemonAlive(host.other_config))
      if (liveHost !== undefined) {
        throw incorrectState({
          actual: 'no TWINSTOR SR advertises its replication state',
          expected: 'a TWINSTOR SR advertising its replication state',
          object: liveHost.uuid,
          property: 'twinstorStorageState',
        })
      }
    }

    await this._assertTwinstorReady(twinstor)

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
            const twinstorPublished = await this._waitForTwinstorSync(twinstor, {
              name: 'Waiting for TWINSTOR storage to be in sync before rebooting',
              objectId: hostId,
              hostId,
              hostName,
            })
            // this host is about to go down and resync on its way back, so the
            // advertisement just accepted no longer holds. Nothing clears it,
            // and it stays young enough to pass a freshness check for minutes,
            // longer than a host takes to boot: requiring the next one to be
            // strictly newer is what makes the gate a barrier.
            twinstor.publishedBefore = twinstorPublished

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
