import { Task } from './Task.mjs'

export class HealthCheckVmBackup {
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
          timeoutMessage: refOrUuid =>
            `local xapi  did not get Running state for VM ${refOrUuid} after ${timeout / 1000} second`,
        })

        const running = new Date()
        remainingTimeout -= running - started

        // wait for the guest tools to be detected
        await xapi.waitObjectState(restoredVm.guest_metrics, gm => gm?.PV_drivers_detected, {
          timeout: remainingTimeout,
          timeoutMessage: refOrUuid =>
            `timeout reached while waiting for ${refOrUuid} to report the driver version through the Xen tools. Please check or update the Xen tools.`,
        })

        const guestToolsReady = new Date()
        remainingTimeout -= guestToolsReady - running

        if (waitForScript) {
          const startedRestoredVm = await xapi.waitObjectState(
            restoredVm.$ref,
            vm =>
              vm?.xenstore_data !== undefined &&
              (vm.xenstore_data['vm-data/xo-backup-health-check'] === 'success' ||
                vm.xenstore_data['vm-data/xo-backup-health-check'] === 'failure'),
            {
              timeout: remainingTimeout,
              timeoutMessage: refOrUuid =>
                `timeout reached while waiting for ${refOrUuid} to report the startup script execution.`,
            }
          )

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
