import type { XoPoolDashboard } from '@/modules/pool/types/xo-pool-dashboard.type.ts'
import { type CardTitle, type DashboardCardProps, itRendersCardTitle } from '@/test/dashboard-card.ts'
import { findProgressBarGroupLegends } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import type { VueWrapper } from '@vue/test-utils'

// The props every card of the pool dashboard takes, for its local mount helper
export type PoolDashboardCardProps = DashboardCardProps<'poolDashboard', XoPoolDashboard>

// Mounts the card, on a dashboard it can show by default
type MountPoolDashboardCard = (props?: PoolDashboardCardProps) => VueWrapper

type PoolTopFiveUsageCase = {
  title: CardTitle
  // The dashboard the card mounts on by default, with one host and one VM in the top five it reads
  dashboard: XoPoolDashboard
  // The same top five, without host nor VM
  empty: XoPoolDashboard
  // The legend of that host and of that VM
  legends: { host: [string, string]; vm: [string, string] }
}

/**
 * Registers the tests the top-five usage cards of the pool dashboard (CPU, RAM) share: the title, a section for the
 * hosts and one for the VMs, each with its own loader, its empty state and the fetch error.
 */
export function itShowsPoolTopFiveUsage(
  mountCard: MountPoolDashboardCard,
  { title, dashboard, empty, legends }: PoolTopFiveUsageCase
) {
  itRendersCardTitle(mountCard, title)

  it('splits the card between the hosts and the VMs, each capped to the top five', () => {
    const wrapper = mountCard()

    expect(wrapper.findAll('.ui-card-subtitle').map(subtitle => subtitle.text())).toEqual([
      `${t('host')} ${t('top-#', 5)}`,
      `${t('vms')} ${t('top-#', 5)}`,
    ])
  })

  it('shows the usage of the hosts and of the VMs in their own section', () => {
    expect(findProgressBarGroupLegends(mountCard())).toEqual([[legends.host], [legends.vm]])
  })

  it.each([
    ['hosts', { ...dashboard, hosts: {} }, legends.vm],
    ['VMs', { ...dashboard, vms: {} }, legends.host],
  ])('shows a loader in place of the %s while their usage has not arrived yet', (_, poolDashboard, remainingLegend) => {
    const wrapper = mountCard({ poolDashboard })

    expect(wrapper.findAll('.ui-loader')).toHaveLength(1)
    expect(findProgressBarGroupLegends(wrapper)).toEqual([[remainingLegend]])
  })

  it('reports that there is nothing to show in a section without host or VM', () => {
    const wrapper = mountCard({ poolDashboard: empty })

    expect(wrapper.findAll('.vts-state-hero').map(hero => hero.text())).toEqual([
      t('no-data-to-calculate'),
      t('no-data-to-calculate'),
    ])
    expect(wrapper.findAll('.ui-progress-bar')).toEqual([])
  })

  it('passes the fetch error down to both sections', () => {
    const wrapper = mountCard({ hasError: true })

    expect(wrapper.findAll('.vts-state-hero').map(hero => hero.text())).toEqual([
      t('error-no-data'),
      t('error-no-data'),
    ])
  })
}
