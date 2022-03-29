'use strict'

const RUNNING_POWER_STATES = {
  Running: true,
  Paused: true,
}

module.exports = vmOrPowerState =>
  (typeof vmOrPowerState === 'string' ? vmOrPowerState : vmOrPowerState.power_state) in RUNNING_POWER_STATES
