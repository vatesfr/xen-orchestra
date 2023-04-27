'use strict'

const { Task } = require('./Task')

exports.HealthCheckVmBackup = class HealthCheckVmBackup {
  #restoredVm
  #timeout
  #xapi

  constructor({ restoredVm, timeout = 10 * 60 * 1000, xapi }) {
    this.#restoredVm = restoredVm
    this.#xapi = xapi
    this.#timeout = timeout
  }

  async run() {
    return Task.run(
      {
        name: 'vmstart',
      },
      async () => {
        let restoredVm = this.#restoredVm
        const xapi = this.#xapi
        const restoredId = restoredVm.uuid

        // remove vifs
        await Promise.all(restoredVm.$VIFs.map(vif => xapi.callAsync('VIF.destroy', vif.$ref)))
        const waitForScript = restoredVm.tags.includes('xo-backup-health-check-xenstore')
        if (waitForScript) {
          await restoredVm.set_xenstore_data({
            'vm-data/xo-backup-health-check': 'planned',
          })
        }
        const start = new Date()
        // start Vm

        await xapi.callAsync(
          'VM.start',
          restoredVm.$ref,
          false, // Start paused?
          false // Skip pre-boot checks?
        )
        const started = new Date()
        const timeout = this.#timeout
        const startDuration = started - start

        let remainingTimeout = timeout - startDuration

        if (remainingTimeout < 0) {
          throw new Error(`VM ${restoredId} not started after ${timeout / 1000} second`)
        }

        // wait for the 'Running' event to be really stored in local xapi object cache
        restoredVm = await xapi.waitObjectState(restoredVm.$ref, vm => vm.power_state === 'Running', {
          timeout: remainingTimeout,
        })

        const running = new Date()
        remainingTimeout -= running - started

        if (remainingTimeout < 0) {
          throw new Error(`local xapi  did not get Running state for VM ${restoredId} after ${timeout / 1000} second`)
        }
        // wait for the guest tool version to be defined
        await xapi.waitObjectState(restoredVm.guest_metrics, gm => gm?.PV_drivers_version?.major !== undefined, {
          timeout: remainingTimeout,
        })

        const guestToolsReady = new Date()
        remainingTimeout -= guestToolsReady - running
        if (remainingTimeout < 0) {
          throw new Error(`local xapi  did not get he guest tools check ${restoredId} after ${timeout / 1000} second`)
        }

        if (waitForScript) {
          const startedRestoredVm = await xapi.waitObjectState(
            restoredVm.$ref,
            vm =>
              vm?.xenstore_data !== undefined &&
              (vm.xenstore_data['vm-data/xo-backup-health-check'] === 'success' ||
                vm.xenstore_data['vm-data/xo-backup-health-check'] === 'failure'),
            {
              timeout: remainingTimeout,
            }
          )
          const scriptOk = new Date()
          remainingTimeout -= scriptOk - guestToolsReady
          if (remainingTimeout < 0) {
            throw new Error(
              `Backup health check script did not update vm-data/xo-backup-health-check of ${restoredId} after ${
                timeout / 1000
              } second, got ${
                startedRestoredVm.xenstore_data['vm-data/xo-backup-health-check']
              } instead of 'success' or 'failure'`
            )
          }

          if (startedRestoredVm.xenstore_data['vm-data/xo-backup-health-check'] !== 'success') {
            const message = startedRestoredVm.xenstore_data['vm-data/xo-backup-health-check-error']
            if (message) {
              throw new Error(`Backup health check script failed with message ${message} for VM ${restoredId} `)
            } else {
              throw new Error(`Backup health check script failed for VM ${restoredId} `)
            }
          }
          Task.info('Backup health check script successfully executed')
        }
      }
    )
  }
}
