'use strict'

module.exports = class Host {
  async restartAgent(ref) {
    const agentStartTime = +(await this.getField('host', ref, 'other_config')).agent_start_time

    await this.call('host.restart_agent', ref)

    await new Promise(resolve => {
      // even though the ref could change in case of pool master restart, tests show it stays the same
      const stopWatch = this.watchObject(ref, host => {
        if (+host.other_config.agent_start_time > agentStartTime) {
          stopWatch()
          resolve()
        }
      })
    })
  }
}
