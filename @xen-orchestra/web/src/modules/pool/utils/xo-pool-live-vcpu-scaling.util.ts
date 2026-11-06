import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'

// Mirrors packages/xo-server/src/xapi/_vcpuHeadroom.mjs: keep both in sync

export const DEFAULT_LIVE_VCPU_SCALING_MAX = 16

export const LIVE_VCPU_SCALING_MIN = 2

export const LIVE_VCPU_SCALING_MAX = 128

// Physical cores of a host: XAPI compares the vCPU maximum with the thread count, capping on cores keeps VMs
// startable if SMT is turned off later
export function getHostCores(cpuInfo: FrontXoHost['CPUs'] | undefined): number | undefined {
  const threads = Number(cpuInfo?.cpu_count)
  if (!(threads > 0)) {
    return undefined
  }

  const threadsPerCore = Number(cpuInfo?.threads_per_core)
  return threadsPerCore > 1 ? Math.floor(threads / threadsPerCore) : threads
}

// Physical cores of the smallest host: no new VM gets a higher vCPU maximum
export function getLiveVcpuScalingCap(hosts: Pick<FrontXoHost, 'CPUs'>[]): number | undefined {
  const cores = hosts.map(host => getHostCores(host.CPUs)).filter((n): n is number => n !== undefined)
  return cores.length === 0 ? undefined : Math.min(...cores)
}

// vCPU maximum a new VM gets in the pool, undefined when the pool did not opt in
export function getEffectiveVcpusMax(
  setting: number | undefined,
  hosts: Pick<FrontXoHost, 'CPUs'>[],
  coresPerSocket = 1
): number | undefined {
  if (setting === undefined) {
    return undefined
  }

  const cap = getLiveVcpuScalingCap(hosts)
  if (cap === undefined) {
    return undefined
  }

  const target = Math.min(setting, cap)
  return coresPerSocket > 1 ? target - (target % coresPerSocket) : target
}

export function isValidLiveVcpuScalingMax(value: unknown): value is number {
  return (
    typeof value === 'number' &&
    Number.isInteger(value) &&
    value >= LIVE_VCPU_SCALING_MIN &&
    value <= LIVE_VCPU_SCALING_MAX
  )
}
