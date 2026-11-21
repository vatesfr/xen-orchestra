import PoolDashboardRamUsage from '@/modules/pool/components/dashboard/PoolDashboardRamUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createPoolDashboardTopFiveUsage } from '@/test/create-pool-dashboard.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { itShowsPoolTopFiveUsage, type PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { mount } from '@vue/test-utils'

type HostRamUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['ram'][number]

type VmRamUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['ram'][number]

function createHostRamUsage(overrides: Partial<HostRamUsage> = {}): HostRamUsage {
  return {
    id: 'host-1' as HostRamUsage['id'],
    name_label: 'Host 1',
    percent: 25,
    size: 4294967296,
    usage: 1073741824,
    ...overrides,
  }
}

function createVmRamUsage(overrides: Partial<VmRamUsage> = {}): VmRamUsage {
  return {
    id: 'vm-1' as VmRamUsage['id'],
    name_label: 'VM 1',
    percent: 75,
    memory: 4294967296,
    memoryFree: 1073741824,
    ...overrides,
  }
}

function withTopFiveRam(hosts: HostRamUsage[], vms: VmRamUsage[]): XoPoolDashboard {
  return createPoolDashboardTopFiveUsage({ ram: hosts }, { ram: vms })
}

const POOL_DASHBOARD = withTopFiveRam([createHostRamUsage()], [createVmRamUsage()])

function mountRamUsage(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardRamUsage, {
    props: { poolDashboard: POOL_DASHBOARD, ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsPoolTopFiveUsage(mountRamUsage, {
  title: t('ram-usage'),
  dashboard: POOL_DASHBOARD,
  empty: withTopFiveRam([], []),
  legends: { host: ['Host 1', '1 GiB / 4 GiB'], vm: ['VM 1', '3 GiB / 4 GiB'] },
})
