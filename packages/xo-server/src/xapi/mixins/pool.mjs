import { cancelable, timeout } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { incorrectState } from 'xo-common/api-errors.js'
import { isHostRunning } from '../utils.mjs'
import { parseDateTime } from '@xen-orchestra/xapi'
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

  async rollingPoolReboot(
    $defer,
    parentTask,
    { beforeEvacuateVms, beforeRebootHost, ignoreHost, shutdownPinnedVms = false } = {}
  ) {
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

    const hosts = filter(this.objects.all, { $type: 'host' })

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

        if (!ignoreHost || !ignoreHost(host)) {
          await Task.run({ properties: { name: `Restarting host ${hostId}`, hostId, hostName } }, async () => {
            // This is an old metrics reference from before the pool master restart.
            // The references don't seem to change but it's not guaranteed.
            const metricsRef = host.metrics

            await this.barrier(metricsRef)
            await this._waitObjectState(metricsRef, metrics => metrics.live)

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
                  for (const vmRef of pinnedVmRefs) {
                    const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
                    await Task.run(
                      { properties: { name: `Shutting down VM ${vmId}`, hostId, hostName, vmId, vmName } },
                      () => this.callAsync('VM.clean_shutdown', vmRef)
                    )
                    haltedPinnedVms.set(vmRef, host.$ref)
                  }
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
                let error
                for (const vmRef of pinnedVmRefs) {
                  try {
                    const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
                    await Task.run(
                      {
                        properties: { name: `Restarting VM ${vmId} on host ${hostId}`, hostId, hostName, vmId, vmName },
                      },
                      () => this.callAsync('VM.start_on', vmRef, host.$ref, false, false)
                    )
                    haltedPinnedVms.delete(vmRef)
                  } catch (err) {
                    if (error === undefined) {
                      error = err
                    }
                  }
                }
                // still try to start every pinned VM of this host before failing the run
                if (error !== undefined) {
                  throw error
                }
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
