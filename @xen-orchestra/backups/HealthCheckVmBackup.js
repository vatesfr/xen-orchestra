'use strict'

const { Task } = require('./Task')

exports.HealthCheckVmBackup = class HealthCheckVmBackup {
  #restoredVm
  #timeout
  #waitForStartupScript
  #xapi

  constructor({ restoredVm, timeout = 10 * 60 * 1000, waitForStartupScript = false, xapi }) {
    this.#restoredVm = restoredVm
    this.#xapi = xapi
    this.#timeout = timeout
    this.#waitForStartupScript = waitForStartupScript
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

        if (this.#waitForStartupScript) {
          await restoredVm.set_xenstore_data({
            'vm-data/health-check': 'planned',
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

        if (this.#waitForStartupScript) {
          const startedRestoredVm = await xapi.waitObjectState(
            restoredVm.$ref,
            vm =>
              vm?.xenstore_data !== undefined &&
              (vm.xenstore_data['vm-data/health-check'] === 'success' ||
                vm.xenstore_data['vm-data/health-check'] === 'failure'),
            {
              timeout: remainingTimeout,
            }
          )
          const scriptOk = new Date()
          remainingTimeout -= scriptOk - guestToolsReady
          if (remainingTimeout < 0) {
            throw new Error(
              `script did not update vm-data/health-check of ${restoredId} after ${timeout / 1000} second, got ${
                startedRestoredVm.xenstore_data['vm-data/health-check']
              }`
            )
          }

          if (startedRestoredVm.xenstore_data['vm-data/health-check'] !== 'success') {
            throw new Error(
              `script failed with message  ${startedRestoredVm.xenstore_data['vm-data/health-check-error']} for VM ${restoredId} `
            )
          }
          Task.info('Heath check script successfully executed')
        }
      }
    )
  }
}
