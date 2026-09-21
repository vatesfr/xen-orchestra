import HostsCpuUsage from '@/modules/pool/components/dashboard/cpu-usage/HostsCpuUsage.vue'
import VmsCpuUsage from '@/modules/pool/components/dashboard/cpu-usage/VmsCpuUsage.vue'
import PoolDashboardCpuUsage from '@/modules/pool/components/dashboard/PoolDashboardCpuUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { findCardTitleText } from '@/test/find-card-heading.ts'
import { findLegends } from '@/test/find-labelled-values.ts'
import { isLoading } from '@/test/find-loader.ts'
import { findStateHeroText } from '@/test/find-state-hero.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type TopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>

function createPoolDashboard(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return {
    hosts: { topFiveUsage: { cpu: [], ram: [] } as TopFiveUsage },
    vms: { topFiveUsage: { cpu: [], ram: [] } as NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']> },
    ...overrides,
  }
}

function mountCpuUsage(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardCpuUsage, {
    props: { poolDashboard: createPoolDashboard(), ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCpuUsage()

  expect(findCardTitleText(wrapper)).toBe(t('cpu-usage'))
})

it('splits the card between the hosts and the VMs, each capped to the top five', () => {
  const wrapper = mountCpuUsage()

  expect(wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())).toEqual([
    `${t('host')} ${t('top-#', 5)}`,
    `${t('vms')} ${t('top-#', 5)}`,
  ])
})

it('shows a loader in place of the hosts while their usage has not arrived yet', () => {
  const wrapper = mountCpuUsage({ poolDashboard: createPoolDashboard({ hosts: {} }) })

  expect(isLoading(wrapper)).toBe(true)
  expect(wrapper.findComponent(HostsCpuUsage).exists()).toBe(false)
  expect(wrapper.findComponent(VmsCpuUsage).exists()).toBe(true)
})

it('shows a loader in place of the VMs while their usage has not arrived yet', () => {
  const wrapper = mountCpuUsage({ poolDashboard: createPoolDashboard({ vms: {} }) })

  expect(isLoading(wrapper)).toBe(true)
  expect(wrapper.findComponent(HostsCpuUsage).exists()).toBe(true)
  expect(wrapper.findComponent(VmsCpuUsage).exists()).toBe(false)
})

it('plots the usage of the hosts and of the VMs in their own section', () => {
  const wrapper = mountCpuUsage({
    poolDashboard: {
      hosts: {
        topFiveUsage: {
          cpu: [{ id: 'host-1' as never, name_label: 'Host 1', percent: 30 }],
          ram: [],
        } as unknown as TopFiveUsage,
      },
      vms: {
        topFiveUsage: {
          cpu: [{ id: 'vm-1' as never, name_label: 'VM 1', percent: 70 }],
          ram: [],
        } as unknown as NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>,
      },
    },
  })

  expect(findLegends(wrapper.findComponent(HostsCpuUsage))).toEqual([['Host 1', '30%']])
  expect(findLegends(wrapper.findComponent(VmsCpuUsage))).toEqual([['VM 1', '70%']])
})

it('passes the fetch error down to both sections', () => {
  const wrapper = mountCpuUsage({ hasError: true })

  expect(findStateHeroText(wrapper.findComponent(HostsCpuUsage))).toBe(t('error-no-data'))
  expect(findStateHeroText(wrapper.findComponent(VmsCpuUsage))).toBe(t('error-no-data'))
})
