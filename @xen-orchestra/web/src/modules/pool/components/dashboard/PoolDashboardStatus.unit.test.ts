import PoolDashboardStatus from '@/modules/pool/components/dashboard/PoolDashboardStatus.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { itShowsDashboardCardStates } from '@/test/dashboard-card.ts'
import { findCardNumbers, findLegends } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import type { PoolDashboardCardProps } from '@/test/pool-dashboard-card.ts'
import { findStateHeroTexts } from '@core-test/find-state-hero-types.ts'
import { mount, type VueWrapper } from '@vue/test-utils'

type HostsStatus = NonNullable<NonNullable<XoPoolDashboard['hosts']>['status']>

type VmsStatus = NonNullable<NonNullable<XoPoolDashboard['vms']>['status']>

function createHostsStatus(overrides: Partial<HostsStatus> = {}): HostsStatus {
  return { running: 2, disabled: 1, halted: 1, total: 4, ...overrides }
}

function createVmsStatus(overrides: Partial<VmsStatus> = {}): VmsStatus {
  return { running: 5, paused: 2, suspended: 1, halted: 2, total: 10, ...overrides }
}

function createPoolDashboardStatus(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return {
    hosts: { status: createHostsStatus() },
    vms: { status: createVmsStatus() },
    ...overrides,
  }
}

function mountStatus(props: PoolDashboardCardProps = {}) {
  return mount(PoolDashboardStatus, {
    props: { poolDashboard: createPoolDashboardStatus(), ...props },
    global: createGlobalTestConfig(),
  })
}

function findLegendSections(wrapper: VueWrapper) {
  return wrapper
    .findAll('.vts-donut-chart-with-legend')
    .map(section => [section.get('.ui-legend-title').text(), findLegends(section)])
}

itShowsDashboardCardStates(mountStatus, {
  dashboardProp: 'poolDashboard',
  title: t('status'),
  missing: {
    'the status of the hosts': { hosts: {}, vms: { status: createVmsStatus() } },
    'the status of the VMs': { hosts: { status: createHostsStatus() }, vms: {} },
  },
  findContent: findLegendSections,
  hasErrorState: true,
})

it('breaks down the hosts and the VMs by status', () => {
  const wrapper = mountStatus()

  expect(findLegendSections(wrapper)).toEqual([
    [
      t('hosts'),
      [
        [t('host:status:running', 2), '2'],
        [t('disabled', 2), '1'],
        [t('host:status:halted', 2), '1'],
      ],
    ],
    [
      t('vms'),
      [
        [t('vm:status:running', 2), '5'],
        [t('vm:status:paused', 2), '2'],
        [t('vm:status:suspended', 2), '1'],
        [t('vm:status:halted', 2), '2'],
      ],
    ],
  ])
})

it('totals the hosts and the VMs of the pool', () => {
  const wrapper = mountStatus()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('total'), '4'],
    [t('total'), '10'],
  ])
})

it('reports that no VM was detected for a pool without VM, and still breaks down the hosts', () => {
  const wrapper = mountStatus({
    poolDashboard: createPoolDashboardStatus({
      vms: { status: createVmsStatus({ running: 0, paused: 0, suspended: 0, halted: 0, total: 0 }) },
    }),
  })

  expect(findStateHeroTexts(wrapper)).toEqual([t('no-vm-detected')])
  expect(findLegendSections(wrapper).map(([title]) => title)).toEqual([t('hosts')])
  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '4']])
})

it('counts a status the pool does not report as zero', () => {
  const wrapper = mountStatus({
    poolDashboard: { hosts: { status: { running: 2, total: 2 } as HostsStatus }, vms: { status: createVmsStatus() } },
  })

  expect(findLegendSections(wrapper)[0]).toEqual([
    t('hosts'),
    [
      [t('host:status:running', 2), '2'],
      [t('disabled', 2), '0'],
      [t('host:status:halted', 2), '0'],
    ],
  ])
})
