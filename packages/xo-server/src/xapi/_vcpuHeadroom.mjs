// Live vCPU scaling: when a pool opts in, the VMs XO creates from a template get a vCPU maximum above the number
// they start with, so vCPUs can be added later while the VM runs. XAPI only lets VCPUs_max change on a halted VM.

// pool other_config key holding the vCPU maximum given to new VMs, absent when the pool did not opt in
export const POOL_KEY = 'xo:vcpusMaxHeadroom'

// value suggested when a pool opts in
export const DEFAULT_VCPUS_MAX = 16

// Xen limit for HVM guests (HVM_MAX_VCPUS), also the highest accepted setting
export const HVM_MAX_VCPUS = 128

export function parseVcpusMaxSetting(value) {
  const n = Number(value)
  return Number.isSafeInteger(n) && n >= 2 && n <= HVM_MAX_VCPUS ? n : undefined
}

// Physical cores of a host, from its XAPI cpu_info.
//
// XAPI refuses to start or migrate a VM whose VCPUs_max exceeds the host's cpu_count, which counts threads. Capping
// on cores rather than threads leaves a margin: VMs keep starting if SMT is turned off later, which halves
// cpu_count.
export function getHostCores(cpuInfo) {
  const threads = +cpuInfo?.cpu_count
  if (!(threads > 0)) {
    return
  }
  const threadsPerCore = +cpuInfo.threads_per_core
  return threadsPerCore > 1 ? Math.floor(threads / threadsPerCore) : threads
}

// Windows does not bring vCPUs online or offline the way Linux does: live removal is ignored by the guest, and
// the XCP-ng tools 9.2 stop answering clean shutdown requests after a live addition. Windows templates set the
// Xen PCI device used by Windows Update (device_id 0002) and the viridian enlightenments; a running VM with guest
// tools also reports its OS.
export const isWindowsVm = vm =>
  vm.platform?.device_id === '0002' ||
  vm.platform?.viridian === 'true' ||
  vm.$guest_metrics?.os_version?.distro === 'windows'

// Whether the parameters of a new VM ask for a vCPU maximum of their own, which wins over the pool setting: only a
// maximum above what the VM would get anyway counts. XO 5 always sends max(vCPUs, template maximum).
export function hasExplicitVcpusMax(props, template) {
  const requestedMax = +(props.cpusMax ?? props.cpusStaticMax)
  const requestedCpus = +(props.cpus ?? props.CPUs) || 0
  return requestedMax > Math.max(requestedCpus, +template.VCPUs_max || 0)
}

// Returns the vCPU maximum to set on a new VM, or undefined to leave it as is.
//
// - never above the physical cores of the smallest host of the pool (see getHostCores), so the VM can start, be
//   restarted by HA and be evacuated anywhere in the pool
// - a multiple of the cores per socket, so the CPU topology stays valid
// - never lower than the current maximum
export function computeVcpusMax({ setting, hostCores, coresPerSocket, currentMax }) {
  if (setting === undefined || hostCores.length === 0) {
    return
  }

  let target = Math.min(setting, ...hostCores)
  if (coresPerSocket > 1) {
    target -= target % coresPerSocket
  }

  return target > currentMax ? target : undefined
}
