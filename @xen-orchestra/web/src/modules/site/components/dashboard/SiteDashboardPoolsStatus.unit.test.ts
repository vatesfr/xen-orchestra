import SiteDashboardPoolsStatus from '@/modules/site/components/dashboard/SiteDashboardPoolsStatus.vue'
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

const mountPoolsStatus = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardPoolsStatus, overrides)

it('names the card and links to the pools page', () => {
  const wrapper = mountPoolsStatus()

  expect(findCardHeading(wrapper)).toEqual({ title: t('pools-status'), info: t('action:see-all') })
  expect(wrapper.get('.ui-card-title .info a').attributes('href')).toBe('/pools')
})

it('shows a loader while the status of the pools has not arrived', () => {
  const wrapper = mountPoolsStatus({ poolsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountPoolsStatus()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('keeps the loader over the error while the status of the pools has not arrived', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountPoolsStatus({ poolsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(wrapper.findAll('.vts-state-hero')).toHaveLength(1)
})

it('breaks down the pools by status', () => {
  const wrapper = mountPoolsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('pool:status:connected', 2), '5'],
    [t('pool:status:disconnected', 2), '3'],
    [t('pool:status:unreachable', 2), '2'],
  ])
})

it('totals the pools of the site', () => {
  const wrapper = mountPoolsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '11']])
})

it('counts a status the site does not report as zero', () => {
  const wrapper = mountPoolsStatus({ poolsStatus: { connected: 5, total: 5 } as XoDashboard['poolsStatus'] })

  expect(findLegends(wrapper)).toEqual([
    [t('pool:status:connected', 2), '5'],
    [t('pool:status:disconnected', 2), '0'],
    [t('pool:status:unreachable', 2), '0'],
  ])
})
