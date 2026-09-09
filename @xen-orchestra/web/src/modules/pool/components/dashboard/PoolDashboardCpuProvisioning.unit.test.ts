import PoolDashboardCpuProvisioning from '@/modules/pool/components/dashboard/PoolDashboardCpuProvisioning.vue'
import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { findCardNumbers } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

type CpuProvisioning = NonNullable<XoPoolDashboard['cpuProvisioning']>

function withCpuProvisioning(overrides: Partial<CpuProvisioning> = {}): XoPoolDashboard {
  return { cpuProvisioning: { assigned: 6, total: 8, percent: 75, ...overrides } }
}

function mountProvisioning(props: { poolDashboard?: XoPoolDashboard; hasError?: boolean } = {}) {
  return mount(PoolDashboardCpuProvisioning, {
    props: { poolDashboard: withCpuProvisioning(), ...props },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('cpu-provisioning'))
})

it('shows a loader while the dashboard has not arrived yet', () => {
  const wrapper = mountProvisioning({ poolDashboard: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('shows a loader while the provisioning is missing from the dashboard', () => {
  const wrapper = mountProvisioning({ poolDashboard: {} })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
})

it('shows an error message when the dashboard could not be fetched', () => {
  const wrapper = mountProvisioning({ hasError: true })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
})

it('splits the CPUs of the pool between what is assigned and what it holds', () => {
  const wrapper = mountProvisioning()

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '6'],
    [t('total-cpus'), '8'],
  ])
})

it('fills the progress bar with the share of the CPUs assigned', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-progress-bar .fill').attributes('style')).toBe('width: 75%;')
})

it('labels the progress bar with the share of the CPUs assigned', () => {
  const wrapper = mountProvisioning()

  expect(wrapper.get('.ui-legend').text()).toBe(`${t('vcpus')}75%`)
})

it('reports no CPU for a pool provisioning nothing', () => {
  const wrapper = mountProvisioning({ poolDashboard: withCpuProvisioning({ assigned: 0, total: 0, percent: 0 }) })

  expect(findCardNumbers(wrapper)).toEqual([
    [t('vcpus-assigned'), '0'],
    [t('total-cpus'), '0'],
  ])
})
