import SiteDashboardHostsStatus from '@/modules/site/components/dashboard/SiteDashboardHostsStatus.vue'
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

const mountHostsStatus = (overrides?: Partial<XoDashboard>) =>
  siteDashboard.mountCard(SiteDashboardHostsStatus, overrides)

it('names the card and links to the hosts page', () => {
  const wrapper = mountHostsStatus()

  expect(findCardHeading(wrapper)).toEqual({ title: t('hosts-status'), info: t('action:see-all') })
  expect(wrapper.get('.ui-card-title .info a').attributes('href')).toBe('/hosts')
})

it('shows a loader while the status of the hosts has not arrived', () => {
  const wrapper = mountHostsStatus({ hostsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(findLegends(wrapper)).toEqual([])
})

it('shows an error message when the dashboard could not be fetched', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountHostsStatus()

  expect(wrapper.get('.vts-state-hero').text()).toBe(t('error-no-data'))
  expect(findLegends(wrapper)).toEqual([])
})

it('keeps the loader over the error while the status of the hosts has not arrived', () => {
  siteDashboard.hasError.value = true

  const wrapper = mountHostsStatus({ hostsStatus: undefined })

  expect(wrapper.find('.ui-loader').exists()).toBe(true)
  expect(wrapper.findAll('.vts-state-hero')).toHaveLength(1)
})

it('breaks down the hosts by status', () => {
  const wrapper = mountHostsStatus()

  expect(findLegends(wrapper)).toEqual([
    [t('host:status:running', 2), '6'],
    [t('host:status:disabled', 2), '2'],
    [t('host:status:halted', 2), '3'],
  ])
})

it('totals the hosts of the site', () => {
  const wrapper = mountHostsStatus()

  expect(findCardNumbers(wrapper)).toEqual([[t('total'), '12']])
})
