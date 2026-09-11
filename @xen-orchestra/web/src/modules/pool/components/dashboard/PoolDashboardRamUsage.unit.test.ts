import PoolDashboardRamUsage from '@/modules/pool/components/dashboard/PoolDashboardRamUsage.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createPoolDashboardTopFiveUsage } from '@/test/create-pool-dashboard.ts'
import { findProgressBarGroupLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
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

function createPoolDashboard(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return { ...withTopFiveRam([createHostRamUsage()], [createVmRamUsage()]), ...overrides }
}

function mountRamUsage(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardRamUsage, {
    props: { poolDashboard: createPoolDashboard(), ...props },
    global: createGlobalTestConfig(),
  })
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

it('shows the memory of the hosts and of the VMs in their own section', () => {
  const wrapper = mountRamUsage()

  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['Host 1', '1 GiB / 4 GiB']], [['VM 1', '3 GiB / 4 GiB']]])
})

it('shows a loader in place of the hosts while their usage has not arrived yet', () => {
  const wrapper = mountRamUsage({ poolDashboard: createPoolDashboard({ hosts: {} }) })

  expect(wrapper.findAll('.ui-loader')).toHaveLength(1)
  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['VM 1', '3 GiB / 4 GiB']]])
})

it('shows a loader in place of the VMs while their usage has not arrived yet', () => {
  const wrapper = mountRamUsage({ poolDashboard: createPoolDashboard({ vms: {} }) })

  expect(wrapper.findAll('.ui-loader')).toHaveLength(1)
  expect(findProgressBarGroupLegends(wrapper)).toEqual([[['Host 1', '1 GiB / 4 GiB']]])
})

it('passes the fetch error down to both sections', () => {
  const wrapper = mountRamUsage({ hasError: true })

  expect(wrapper.findAll('.vts-state-hero').map(hero => hero.text())).toEqual([t('error-no-data'), t('error-no-data')])
})
