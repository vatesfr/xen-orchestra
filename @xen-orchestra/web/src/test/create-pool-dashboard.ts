import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'

type HostsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>

type VmsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>

/**
 * Builds an `XoPoolDashboard` carrying a top-five usage section for the hosts
 * and for the VMs.
 *
 * Both metrics of a section default to empty, so a case fills in only the one
 * it exercises: each card reads `cpu` or `ram`, never both.
 */
export function createPoolDashboardTopFiveUsage(
  hosts: Partial<HostsTopFiveUsage> = {},
  vms: Partial<VmsTopFiveUsage> = {}
): XoPoolDashboard {
  return {
    hosts: { topFiveUsage: { cpu: [], ram: [], ...hosts } },
    vms: { topFiveUsage: { cpu: [], ram: [], ...vms } },
  }
}
