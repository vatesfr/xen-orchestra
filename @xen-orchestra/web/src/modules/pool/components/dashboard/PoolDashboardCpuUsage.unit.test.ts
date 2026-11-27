import PoolDashboardCpuUsage from '@/modules/pool/components/dashboard/PoolDashboardCpuUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createPoolDashboardTopFiveUsage } from '@/test/create-pool-dashboard.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { itShowsPoolTopFiveUsage, type PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { findProgressBarAccents } from '@core-test/find-progress-bars.ts'
import { mount } from '@vue/test-utils'

type HostCpuUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>['cpu'][number]

type VmCpuUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>['cpu'][number]

function createHostCpuUsage(overrides: Partial<HostCpuUsage> = {}): HostCpuUsage {
  return { id: 'host-1' as HostCpuUsage['id'], name_label: 'Host 1', percent: 30, ...overrides }
}

function createVmCpuUsage(overrides: Partial<VmCpuUsage> = {}): VmCpuUsage {
  return { id: 'vm-1' as VmCpuUsage['id'], name_label: 'VM 1', percent: 70, ...overrides }
}

function withTopFiveCpu(hosts: HostCpuUsage[], vms: VmCpuUsage[]): XoPoolDashboard {
  return createPoolDashboardTopFiveUsage({ cpu: hosts }, { cpu: vms })
}

const POOL_DASHBOARD = withTopFiveCpu([createHostCpuUsage()], [createVmCpuUsage()])

function mountCpuUsage(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardCpuUsage, {
    props: { poolDashboard: POOL_DASHBOARD, ...props },
    global: createGlobalTestConfig(),
  })
}

itShowsPoolTopFiveUsage(mountCpuUsage, {
  title: t('cpu-usage'),
  dashboard: POOL_DASHBOARD,
  empty: withTopFiveCpu([], []),
  legends: { host: ['Host 1', '30%'], vm: ['VM 1', '70%'] },
})

it('measures both sections against the CPU thresholds, which a full CPU has yet to reach', () => {
  const wrapper = mountCpuUsage({
    poolDashboard: withTopFiveCpu([createHostCpuUsage({ percent: 85 })], [createVmCpuUsage({ percent: 85 })]),
  })

  expect(findProgressBarAccents(wrapper)).toEqual(['info', 'info'])
})
