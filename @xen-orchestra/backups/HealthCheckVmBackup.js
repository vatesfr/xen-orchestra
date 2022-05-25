'use strict'

const { Task } = require('./Task')

exports.HealthCheckVmBackup = class HealthCheckVmBackup {
  #xapi
  #restoredVm

  constructor({ restoredVm, xapi }) {
    this.#restoredVm = restoredVm
    this.#xapi = xapi
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

        const start = new Date()
        // start Vm

        await xapi.callAsync(
          'VM.start',
          restoredVm.$ref,
          false, // Start paused?
          false // Skip pre-boot checks?
        )
        const started = new Date()
        const timeout = 10 * 60 * 1000
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
          throw new Error(`local xapi  did not get Runnig state for VM ${restoredId} after ${timeout / 1000} second`)
        }
        // wait for the guest tool version to be defined
        await xapi.waitObjectState(restoredVm.guest_metrics, gm => gm?.PV_drivers_version?.major !== undefined, {
          timeout: remainingTimeout,
        })
      }
    )
  }
}
