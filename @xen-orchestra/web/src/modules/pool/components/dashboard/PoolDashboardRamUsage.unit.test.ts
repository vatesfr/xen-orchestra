import PoolDashboardRamUsage from '@/modules/pool/components/dashboard/PoolDashboardRamUsage.vue'
import HostsRamUsage from '@/modules/pool/components/dashboard/ram-usage/HostsRamUsage.vue'
import VmsRamUsage from '@/modules/pool/components/dashboard/ram-usage/VmsRamUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type HostsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['hosts']>['topFiveUsage']>

type VmsTopFiveUsage = NonNullable<NonNullable<XoPoolDashboard['vms']>['topFiveUsage']>

function withTopFiveUsage(hosts: HostsTopFiveUsage['ram'], vms: VmsTopFiveUsage['ram']): XoPoolDashboard {
  return {
    hosts: { topFiveUsage: { cpu: [], ram: hosts } },
    vms: { topFiveUsage: { cpu: [], ram: vms } },
  }
}

function createPoolDashboard(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return { ...withTopFiveUsage([], []), ...overrides }
}

function mountRamUsage(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardRamUsage, {
    props: { poolDashboard: createPoolDashboard(), ...props },
    global: createGlobalTestConfig(),
  })
}

function findLegends(section: VueWrapper) {
  return section
    .findAll('.ui-legend')
    .map(legend => [legend.get('.label').text(), legend.get('.value-and-unit').text()])
}

it('renders the card title', () => {
  const wrapper = mountRamUsage()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('ram-usage'))
})

it('splits the card between the hosts and the VMs, each capped to the top five', () => {
  const wrapper = mountRamUsage()

  expect(wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())).toEqual([
    `${t('host')} ${t('top-#', 5)}`,
    `${t('vms')} ${t('top-#', 5)}`,
  ])
})

it('shows a loader in place of the hosts while their usage has not arrived yet', () => {
  const wrapper = mountRamUsage({ poolDashboard: createPoolDashboard({ hosts: {} }) })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(wrapper.findComponent(HostsRamUsage).exists()).toBe(false)
  expect(wrapper.findComponent(VmsRamUsage).exists()).toBe(true)
})

it('shows a loader in place of the VMs while their usage has not arrived yet', () => {
  const wrapper = mountRamUsage({ poolDashboard: createPoolDashboard({ vms: {} }) })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(wrapper.findComponent(HostsRamUsage).exists()).toBe(true)
  expect(wrapper.findComponent(VmsRamUsage).exists()).toBe(false)
})

it('shows the memory of the hosts and of the VMs in their own section', () => {
  const wrapper = mountRamUsage({
    poolDashboard: withTopFiveUsage(
      [
        {
          id: 'host-1' as HostsTopFiveUsage['ram'][number]['id'],
          name_label: 'Host 1',
          percent: 25,
          size: 4294967296,
          usage: 1073741824,
        },
      ],
      [
        {
          id: 'vm-1' as VmsTopFiveUsage['ram'][number]['id'],
          name_label: 'VM 1',
          percent: 75,
          memory: 4294967296,
          memoryFree: 1073741824,
        },
      ]
    ),
  })

  expect(findLegends(wrapper.findComponent(HostsRamUsage))).toEqual([['Host 1', '1 GiB / 4 GiB']])
  expect(findLegends(wrapper.findComponent(VmsRamUsage))).toEqual([['VM 1', '3 GiB / 4 GiB']])
})

it('passes the fetch error down to both sections', () => {
  const wrapper = mountRamUsage({ hasError: true })

  expect(wrapper.findComponent(HostsRamUsage).get('.vts-state-hero').text()).toBe(t('error-no-data'))
  expect(wrapper.findComponent(VmsRamUsage).get('.vts-state-hero').text()).toBe(t('error-no-data'))
})
