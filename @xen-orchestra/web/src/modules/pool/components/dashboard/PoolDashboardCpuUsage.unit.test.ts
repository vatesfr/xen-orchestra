import PoolDashboardCpuUsage from '@/modules/pool/components/dashboard/PoolDashboardCpuUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createPoolDashboardTopFiveUsage } from '@/test/create-pool-dashboard.ts'
import { findProgressBarGroupLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
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

function createPoolDashboard(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return { ...withTopFiveCpu([createHostCpuUsage()], [createVmCpuUsage()]), ...overrides }
}

function mountCpuUsage(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardCpuUsage, {
    props: { poolDashboard: createPoolDashboard(), ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCpuUsage()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('cpu-usage'))
})

it('splits the card between the hosts and the VMs, each capped to the top five', () => {
  const wrapper = mountCpuUsage()

  expect(wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())).toEqual([
    `${t('host')} ${t('top-#', 5)}`,
    `${t('vms')} ${t('top-#', 5)}`,
  ])
})

it('plots the usage of the hosts and of the VMs in their own section', () => {
  const wrapper = mountCpuUsage()

  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['Host 1', '30%']], [['VM 1', '70%']]])
})

it('shows a loader in place of the hosts while their usage has not arrived yet', () => {
  const wrapper = mountCpuUsage({ poolDashboard: createPoolDashboard({ hosts: {} }) })

  expect(wrapper.findAll('.ui-loader')).toHaveLength(1)
  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['VM 1', '70%']]])
})

it('shows a loader in place of the VMs while their usage has not arrived yet', () => {
  const wrapper = mountCpuUsage({ poolDashboard: createPoolDashboard({ vms: {} }) })

  expect(wrapper.findAll('.ui-loader')).toHaveLength(1)
  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['Host 1', '30%']]])
})

it('measures both sections against the CPU thresholds, which a full CPU has yet to reach', () => {
  const wrapper = mountCpuUsage({
    poolDashboard: withTopFiveCpu([createHostCpuUsage({ percent: 85 })], [createVmCpuUsage({ percent: 85 })]),
  })

  expect(wrapper.findAll('.ui-progress-bar').map(bar => bar.classes('accent--info'))).toEqual([true, true])
})

it('passes the fetch error down to both sections', () => {
  const wrapper = mountCpuUsage({ hasError: true })

  expect(wrapper.findAll('.vts-state-hero').map(hero => hero.text())).toEqual([t('error-no-data'), t('error-no-data')])
})
