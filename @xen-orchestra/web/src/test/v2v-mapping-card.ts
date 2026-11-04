import { DISKOR_POOL_NAME } from '@/test/create-pool.ts'
import { findPanelCardTitles } from '@/test/find-card-title.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { t } from '@/test/i18n.ts'
import VtsDivider from '@core/components/divider/VtsDivider.vue'
import VtsStateHero from '@core/components/state-hero/VtsStateHero.vue'
import type { VueWrapper } from '@vue/test-utils'

type V2vMappingCardLayoutCase = {
  // Mounted on the pool `DISKOR_POOL_NAME`, with disks and network adapters unless emptied, loaded unless told
  mountCard: (props?: { diskRows?: never[]; nicRows?: never[]; loading?: boolean }) => VueWrapper
  title: string
}

export function countDividers(wrapper: Pick<VueWrapper, 'findAllComponents'>) {
  return wrapper.findAllComponents(VtsDivider).length
}

/**
 * Declares the cases every V2V mapping card of the side panel shares: its title, then its disk and network adapter
 * sections, each set apart, left out without devices, and the pool alone while loading.
 */
export function describeV2vMappingCardLayout({ mountCard, title }: V2vMappingCardLayoutCase) {
  it('titles the card, then the disks and the network adapters, each set apart', () => {
    const wrapper = mountCard()

    expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([
      [title, t('disks'), t('network-adapters')],
      2,
    ])
  })

  it.each([
    ['disks', { diskRows: [] }, [title, t('network-adapters')]],
    ['network adapters', { nicRows: [] }, [title, t('disks')]],
  ])('leaves out the %s of a VM without any, and their divider', (_, rows, titles) => {
    const wrapper = mountCard(rows)

    expect([findPanelCardTitles(wrapper), countDividers(wrapper)]).toEqual([titles, 1])
  })

  it('shows the devices busy, the pool alone, while loading', () => {
    const wrapper = mountCard({ loading: true })

    expect(wrapper.getComponent(VtsStateHero).props('type')).toBe('busy')
    expect([findPanelCardTitles(wrapper), findCardLabelledValues(wrapper), countDividers(wrapper)]).toEqual([
      [title],
      { [t('pool')]: DISKOR_POOL_NAME },
      1,
    ])
  })
}
