// Copied from packages/xo-server/src/xapi/utils.mjs.
//
// Same reason as _utils.mjs: the helpers are pure, but the module imports
// `../utils.mjs` at module level.

import semver from 'semver'

export const isHostRunning = host => {
  const { $metrics } = host

  return $metrics && $metrics.live
}

export const getVmDomainType = vm => {
  const dt = vm.domain_type
  if (
    dt !== undefined && // XS < 7.5
    dt !== 'unspecified' // detection failed
  ) {
    return dt
  }
  return vm.HVM_boot_policy === '' ? 'pv' : 'hvm'
}

const VM_RUNNING_POWER_STATES = {
  Running: true,
  Paused: true,
}
export const isVmRunning = vm => VM_RUNNING_POWER_STATES[vm.power_state]

// Match Xen Center's condition: https://github.com/xenserver/xenadmin/blob/f3a64fc54bbff239ca6f285406d9034f57537d64/XenModel/Utils/Helpers.cs#L420
export const useUpdateSystem = host => {
  return semver.satisfies(host.software_version.platform_version, '>=2.1.1')
}
