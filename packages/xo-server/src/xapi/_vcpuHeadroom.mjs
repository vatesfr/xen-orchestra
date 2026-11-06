// Live vCPU scaling: when a pool opts in, the VMs XO creates get a vCPU maximum above the number they start
// with, so vCPUs can be added later while the VM runs. XAPI only lets VCPUs_max change on a halted VM.

// pool other_config key holding the vCPU maximum given to new VMs, absent when the pool did not opt in
export const POOL_KEY = 'xo:vcpusMaxHeadroom'

// value suggested when a pool opts in
export const DEFAULT_VCPUS_MAX = 16

// Xen limit for HVM guests (HVM_MAX_VCPUS)
export const HVM_MAX_VCPUS = 128

export function parseVcpusMaxSetting(value) {
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 2 && n <= HVM_MAX_VCPUS ? n : undefined
}

// Windows does not bring vCPUs online or offline the way Linux does: live removal is ignored by the guest, and
// the XCP-ng tools 9.2 stop answering clean shutdown requests after a live addition. Windows templates set the
// Xen PCI device used by Windows Update (device_id 0002) and the viridian enlightenments.
export const isWindowsVm = vm => vm.platform?.device_id === '0002' || vm.platform?.viridian === 'true'

// Returns the vCPU maximum to set on a new VM, or undefined to leave it as is.
//
// - never above the thread count of the smallest host of the pool: XAPI refuses to start or migrate a VM whose
//   VCPUs_max exceeds the host's pCPUs, which would also defeat HA
// - never above the Xen limit for HVM guests
// - a multiple of the cores per socket, so the CPU topology stays valid
// - never lower than the current maximum
export function computeVcpusMax({ setting, hostThreads, coresPerSocket, currentMax, isHvm }) {
  if (setting === undefined || hostThreads.length === 0) {
    return
  }

  let target = Math.min(setting, ...hostThreads)
  if (isHvm) {
    target = Math.min(target, HVM_MAX_VCPUS)
  }
  if (coresPerSocket > 1) {
    target -= target % coresPerSocket
  }

  return target > currentMax ? target : undefined
}
