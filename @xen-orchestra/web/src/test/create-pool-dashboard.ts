import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'

type HostsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>

type VmsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>

// The metric a top-five usage card of the pool dashboard reads
export type PoolTopFiveMetric = 'cpu' | 'ram'

type HostTopFiveUsage<TMetric extends PoolTopFiveMetric> = HostsTopFiveUsage[TMetric][number]

type VmTopFiveUsage<TMetric extends PoolTopFiveMetric> = VmsTopFiveUsage[TMetric][number]

const HOST_TOP_FIVE_USAGE: { [TMetric in PoolTopFiveMetric]: HostTopFiveUsage<TMetric> } = {
  cpu: { id: 'host-1' as HostTopFiveUsage<'cpu'>['id'], name_label: 'Host 1', percent: 30 },
  ram: {
    id: 'host-1' as HostTopFiveUsage<'ram'>['id'],
    name_label: 'Host 1',
    percent: 25,
    size: 4294967296,
    usage: 1073741824,
  },
}

const VM_TOP_FIVE_USAGE: { [TMetric in PoolTopFiveMetric]: VmTopFiveUsage<TMetric> } = {
  cpu: { id: 'vm-1' as VmTopFiveUsage<'cpu'>['id'], name_label: 'VM 1', percent: 70 },
  ram: {
    id: 'vm-1' as VmTopFiveUsage<'ram'>['id'],
    name_label: 'VM 1',
    percent: 75,
    memory: 4294967296,
    memoryFree: 1073741824,
  },
}

// A host of the top five of `metric`: `Host 1`, with the given overrides
export function createHostTopFiveUsage<TMetric extends PoolTopFiveMetric>(
  metric: TMetric,
  overrides: Partial<HostTopFiveUsage<TMetric>> = {}
): HostTopFiveUsage<TMetric> {
  return { ...HOST_TOP_FIVE_USAGE[metric], ...overrides }
}

// A VM of the top five of `metric`: `VM 1`, with the given overrides
export function createVmTopFiveUsage<TMetric extends PoolTopFiveMetric>(
  metric: TMetric,
  overrides: Partial<VmTopFiveUsage<TMetric>> = {}
): VmTopFiveUsage<TMetric> {
  return { ...VM_TOP_FIVE_USAGE[metric], ...overrides }
}

/**
 * Builds an `XoPoolDashboard` whose top five of `metric` holds those hosts and those VMs, `Host 1` and `VM 1` by
 * default. The other metric stays empty: each card reads `cpu` or `ram`, never both.
 */
export function createPoolTopFiveDashboard<TMetric extends PoolTopFiveMetric>(
  metric: TMetric,
  hosts: HostTopFiveUsage<TMetric>[] = [createHostTopFiveUsage(metric)],
  vms: VmTopFiveUsage<TMetric>[] = [createVmTopFiveUsage(metric)]
): XoPoolDashboard {
  return {
    hosts: { topFiveUsage: { cpu: [], ram: [], [metric]: hosts } },
    vms: { topFiveUsage: { cpu: [], ram: [], [metric]: vms } },
  }
}
