import { cancelable, timeout } from 'promise-toolbox'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { incorrectState } from 'xo-common/api-errors.js'
import { isHostRunning } from '../utils.mjs'
import { parseDateTime } from '@xen-orchestra/xapi'
import { Task } from '@xen-orchestra/mixins/Tasks.mjs'
import filter from 'lodash/filter.js'
import groupBy from 'lodash/groupBy.js'
import mapValues from 'lodash/mapValues.js'

const PATH_DB_DUMP = '/pool/xmldbdump'

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

  async rollingPoolReboot($defer, { beforeEvacuateVms, beforeRebootHost, ignoreHost } = {}) {
    if (this.pool.ha_enabled) {
      const haSrs = this.pool.$ha_statefiles.map(vdi => vdi.SR)
      const haConfig = this.pool.ha_configuration
      await this.call('pool.disable_ha')
      $defer(() => this.call('pool.enable_ha', haSrs, haConfig))
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

    await Promise.all(hosts.map(host => host.$call('assert_can_evacuate')))

    if (beforeEvacuateVms) {
      await beforeEvacuateVms()
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
    await Task.run(
      { properties: { name: `Restarting hosts`, total: hosts.length, progress: 0, done: 0 } },
      async () => {
        let done = 0
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
              await Task.run({ properties: { name: `Evacuate`, hostId, hostName } }, async () => {
                await this.clearHost(host)
              })

              if (beforeRebootHost) {
                await beforeRebootHost(host)
              }

              const rebootTime = await getServerTime()
              await Task.run({ properties: { name: `Restart`, hostId, hostName } }, async () => {
                await this.callAsync('host.reboot', host.$ref)
              })

              await Task.run({ properties: { name: `Waiting for host to be up`, hostId, hostName } }, async () => {
                await timeout.call(
                  (async () => {
                    await this._waitObjectState(
                      hostId,
                      host => host.enabled && rebootTime < host.other_config.agent_start_time * 1e3
                    )
                    await this._waitObjectState(metricsRef, metrics => metrics.live)
                  })(),
                  this._restartHostTimeout,
                  new Error(`Host ${hostId} took too long to restart`)
                )
              })
            })
          }
          done++
          Task.set('done', done)
          Task.set('progress', Math.round((done * 100) / hosts.length))
        }
      }
    )

    // Start with the last host since it's the emptiest one after the rolling
    // update
    ;[hosts[0], hosts[hosts.length - 1]] = [hosts[hosts.length - 1], hosts[0]]

    await Task.run({ properties: { name: `Migrate VMs back` } }, async () => {
      let error
      for (const host of hosts) {
        const hostId = host.uuid
        const hostName = host.name_label
        if (ignoreHost && ignoreHost(host)) {
          continue
        }

        const vmRefs = vmRefsByHost[hostId]

        if (vmRefs === undefined) {
          continue
        }
        await Task.run({ properties: { name: `Migrating VMs back to host ${hostId}`, hostId, hostName } }, async () => {
          // host.$resident_VMs is outdated and returns resident VMs before the host.evacuate.
          // this.getField is used in order not to get cached data.
          const residentVmRefs = await this.getField('host', host.$ref, 'resident_VMs')

          for (const vmRef of vmRefs) {
            if (residentVmRefs.includes(vmRef)) {
              continue
            }

            try {
              const { uuid: vmId, name_label: vmName } = this.getObject(vmRef)
              await Task.run(
                { properties: { name: `Migrating VM ${vmId} back to host ${hostId}`, hostId, hostName, vmId, vmName } },
                async () => {
                  await this.migrateVm(vmId, this, hostId)
                }
              )
            } catch (err) {
              if (error === undefined) {
                error = err
              }
            }
          }
        })
      }
      // making the migration task fail if any of the migrations failed
      if (error !== undefined) {
        throw error
      }
    })
  },
}

export default decorateObject(methods, {
  exportPoolMetadata: cancelable,
  importPoolMetadata: cancelable,
  rollingPoolReboot: deferrable,
})
