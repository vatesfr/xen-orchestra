import SiteDashboardVmsStatus from '@/modules/site/components/dashboard/SiteDashboardVmsStatus.vue'
import type { useXoSiteDashboard } from '@/modules/site/remote-resources/use-xo-site-dashboard.ts'
import type { XoDashboard } from '@/modules/site/types/xo-dashboard.type.ts'
import { createSiteDashboardMock } from '@/test/create-site-dashboard-mock.ts'
import { findCardHeading } from '@/test/find-card-heading.ts'
import { findCardNumbers, findLegends } from '@/test/find-labelled-values.ts'
import { t } from '@/test/i18n.ts'

// Read only when the card mounts, so the module-scope state is already initialized
const siteDashboard = createSiteDashboardMock()

vi.mock(import('@/modules/site/remote-resources/use-xo-site-dashboard.ts'), () => ({
  useXoSiteDashboard: (() => siteDashboard) as unknown as typeof useXoSiteDashboard,
}))

beforeEach(() => {
  siteDashboard.reset()
})

const mountVmsStatus = (overrides?: Partial<XoDashboard>) => siteDashboard.mountCard(SiteDashboardVmsStatus, overrides)

it('names the card and links to the VMs page', () => {
  const wrapper = mountVmsStatus()

  expect(findCardHeading(wrapper)).toEqual({ title: t('vms-status'), info: t('action:see-all') })
  expect(wrapper.get('.ui-card-title .info a').attributes('href')).toBe('/vms')
})

it('shows a loader while the status of the VMs has not arrived', () => {
  const wrapper = mountVmsStatus({ vmsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountVmsStatus()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('keeps the loader over the error while the status of the VMs has not arrived', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountVmsStatus({ vmsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(wrapper.findAll('.vts-state-hero')).toHaveLength(1)
})

it('reports that no VM was detected when the site runs none', () => {
  const wrapper = mountVmsStatus({
    vmsStatus: { active: 0, halted: 0, inactive: 0, paused: 0, running: 0, suspended: 0, unknown: 0, total: 0 },
  })

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('no-vm-detected'))
  expect(findLegends(wrapper)).toEqual([])
  expect(findCardNumbers(wrapper)).toEqual([])
})

it('breaks down the VMs by status', () => {
  const wrapper = mountVmsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('vm:status:running', 2), '7'],
    [t('vm:status:paused', 2), '4'],
    [t('vm:status:suspended', 2), '2'],
    [t('vm:status:halted', 2), '5'],
  ])
})

it('totals the VMs of the site', () => {
  const wrapper = mountVmsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '18']])
})
