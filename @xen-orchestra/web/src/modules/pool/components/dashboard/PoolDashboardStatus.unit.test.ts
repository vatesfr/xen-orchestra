import PoolDashboardStatus from '@/modules/pool/components/dashboard/PoolDashboardStatus.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type HostsStatus = NonNullable<NonNullable<XoPoolDashboard['hosts']>['status']>

type VmsStatus = NonNullable<NonNullable<XoPoolDashboard['vms']>['status']>

function createHostsStatus(overrides: Partial<HostsStatus> = {}): HostsStatus {
  return { running: 2, disabled: 1, halted: 1, total: 4, ...overrides }
}

function createVmsStatus(overrides: Partial<VmsStatus> = {}): VmsStatus {
  return { running: 5, paused: 2, suspended: 1, halted: 2, total: 10, ...overrides }
}

function createPoolDashboard(overrides: Partial<XoPoolDashboard> = {}): XoPoolDashboard {
  return {
    hosts: { status: createHostsStatus() },
    vms: { status: createVmsStatus() },
    ...overrides,
  }
}

function mountStatus(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardStatus, {
    props: { poolDashboard: createPoolDashboard(), ...props },
    global: createGlobalTestConfig(),
  })
}

function findLegendSections(wrapper: ReturnType<typeof mountStatus>) {
  return wrapper
    .findAll('.vts-donut-chart-with-legend')
    .map(section => [
      section.get('.ui-legend-title').text(),
      section.findAll('.ui-legend').map(legend => [legend.get('.label').text(), legend.get('.value-and-unit').text()]),
    ])
}

function findNumbers(wrapper: ReturnType<typeof mountStatus>) {
  return wrapper.findAll('.ui-card-numbers').map(card => [card.get('.label').text(), card.get('.values').text()])
}

it('renders the card title', () => {
  const wrapper = mountStatus()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('status'))
})

it('shows a loader while the dashboard has not arrived yet', () => {
  const wrapper = mountStatus({ poolDashboard: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegendSections(wrapper)).toEqual([])
})

it('shows a loader while the status of the hosts is missing from the dashboard', () => {
  const wrapper = mountStatus({ poolDashboard: { hosts: {}, vms: { status: createVmsStatus() } } })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows a loader while the status of the VMs is missing from the dashboard', () => {
  const wrapper = mountStatus({ poolDashboard: { hosts: { status: createHostsStatus() }, vms: {} } })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the dashboard could not be fetched', () => {
  const wrapper = mountStatus({ hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
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

  expect(findNumbers(wrapper)).toEqual([
    [t('total'), '4'],
    [t('total'), '10'],
  ])
})

it('reports that no VM was detected for a pool without VM, and still breaks down the hosts', () => {
  const wrapper = mountStatus({
    poolDashboard: createPoolDashboard({
      vms: { status: createVmsStatus({ running: 0, paused: 0, suspended: 0, halted: 0, total: 0 }) },
    }),
  })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-vm-detected'))
  expect(findLegendSections(wrapper).map(([title]) => title)).toEqual([t('hosts')])
  expect(findNumbers(wrapper)).toEqual([[t('total'), '4']])
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
