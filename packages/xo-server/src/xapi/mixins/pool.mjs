import { cancelable, timeout } from 'promise-toolbox'
import { createLogger } from '@xen-orchestra/log'
import { decorateObject } from '@vates/decorate-with'
import { defer as deferrable } from 'golike-defer'
import { incorrectState } from 'xo-common/api-errors.js'
import { isHostRunning } from '../utils.mjs'
import { parseDateTime } from '@xen-orchestra/xapi'
import filter from 'lodash/filter.js'
import groupBy from 'lodash/groupBy.js'
import mapValues from 'lodash/mapValues.js'

const PATH_DB_DUMP = '/pool/xmldbdump'
const log = createLogger('xo:xapi')

const methods = {
  exportPoolMetadata($cancelToken) {
    return this.getResource($cancelToken, PATH_DB_DUMP, {
      task: this.task_create('Export pool metadata'),
    })
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

    let hasRestartedOne = false
    // Restart all the hosts one by one
    for (const host of hosts) {
      const hostId = host.uuid
      if (ignoreHost && ignoreHost(host)) {
        continue
      }

      // This is an old metrics reference from before the pool master restart.
      // The references don't seem to change but it's not guaranteed.
      const metricsRef = host.metrics

      await this.barrier(metricsRef)
      await this._waitObjectState(metricsRef, metrics => metrics.live)

      const getServerTime = async () => parseDateTime(await this.call('host.get_servertime', host.$ref)) * 1e3
      log.debug(`Evacuate host ${hostId}`)
      await this.clearHost(host)

      if (beforeRebootHost) {
        await beforeRebootHost(host)
      }

      log.debug(`Restart host ${hostId}`)
      const rebootTime = await getServerTime()
      await this.callAsync('host.reboot', host.$ref)

      log.debug(`Wait for host ${hostId} to be up`)
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
      log.debug(`Host ${hostId} is up`)
      hasRestartedOne = true
    }

    if (hasRestartedOne) {
      log.debug('Migrate VMs back to where they were')
    }

    // Start with the last host since it's the emptiest one after the rolling
    // update
    ;[hosts[0], hosts[hosts.length - 1]] = [hosts[hosts.length - 1], hosts[0]]

    let error
    for (const host of hosts) {
      const hostId = host.uuid
      if (ignoreHost && ignoreHost(host)) {
        continue
      }

      const vmRefs = vmRefsByHost[hostId]

      if (vmRefs === undefined) {
        continue
      }

      // host.$resident_VMs is outdated and returns resident VMs before the host.evacuate.
      // this.getField is used in order not to get cached data.
      const residentVmRefs = await this.getField('host', host.$ref, 'resident_VMs')

      for (const vmRef of vmRefs) {
        if (residentVmRefs.includes(vmRef)) {
          continue
        }

        try {
          const vmId = await this.getField('VM', vmRef, 'uuid')
          await this.migrateVm(vmId, this, hostId)
        } catch (err) {
          log.error(err)
          if (error === undefined) {
            error = err
          }
        }
      }
    }

    if (error !== undefined) {
      throw error
    }
  },
}

export default decorateObject(methods, {
  exportPoolMetadata: cancelable,
  importPoolMetadata: cancelable,
  rollingPoolReboot: deferrable,
})
