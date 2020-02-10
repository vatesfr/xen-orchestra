const RUNNING_POWER_STATES = {
  Running: true,
  Paused: true,
}

module.exports = vm => vm.power_state in RUNNING_POWER_STATES
