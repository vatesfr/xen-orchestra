'use strict'

const { asyncEach } = require('@vates/async-each')
const { decorateClass } = require('@vates/decorate-with')
const { defer } = require('golike-defer')

const { getCurrentVmUuid } = require('./_XenStore.js')

const waitAgentRestart = (xapi, hostRef, prevAgentStartTime) =>
  new Promise(resolve => {
    // even though the ref could change in case of pool master restart, tests show it stays the same
    const stopWatch = xapi.watchObject(hostRef, host => {
      if (+host.other_config.agent_start_time > prevAgentStartTime) {
        stopWatch()
        resolve()
      }
    })
  })

class Host {
  async restartAgent(ref) {
    const agentStartTime = +(await this.getField('host', ref, 'other_config')).agent_start_time

    await this.call('host.restart_agent', ref)

    await waitAgentRestart(this, ref, agentStartTime)
  }

  /**
   * Suspend all resident VMS, reboot the host and resume the VMs
   *
   * The current VM is not suspended as to not interrupt the process.
   *
   * @param {string} ref - Opaque reference of the host
   */
  async smartReboot($defer, ref) {
    if (await this.getField('host', ref, 'enabled')) {
      await this.callAsync('host.disable', ref)
      $defer(() => this.callAsync('host.enable', ref))
    }

    let currentVmRef
    try {
      currentVmRef = await this.call('VM.get_by_uuid', await getCurrentVmUuid())
    } catch (error) {}

    await asyncEach(
      await this.getField('host', ref, 'resident_VMs'),
      async vmRef => {
        if (vmRef === currentVmRef) {
          return
        }

        try {
          await this.callAsync('VM.suspend', vmRef)
          $defer(() => this.callAsync('VM.resume', vmRef, false, false))
        } catch (error) {
          const { code } = error

          // operation is not allowed on a control domain, ignore
          if (code === 'OPERATION_NOT_ALLOWED') {
            return
          }

          // ignore if the VM is already halted or suspended
          if (code === 'VM_BAD_POWER_STATE') {
            // power state is usually capitalized in XAPI but is lowercased in this error
            //
            // don't rely on it to be future proof
            const powerState = error.params[2].toLowerCase()
            if (powerState === 'halted' || powerState === 'suspended') {
              return
            }
          }

          throw error
        }
      },
      { stopOnError: false }
    )

    const agentStartTime = +(await this.getField('host', ref, 'other_config')).agent_start_time
    await this.callAsync('host.reboot', ref)
    await waitAgentRestart(this, ref, agentStartTime)
  }
}
module.exports = Host

decorateClass(Host, {
  smartReboot: defer,
})
