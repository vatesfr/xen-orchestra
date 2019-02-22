const RUNNING_POWER_STATES = {
  Running: true,
  Paused: true,
}

module.exports = vm => RUNNING_POWER_STATES[vm.power_state]
