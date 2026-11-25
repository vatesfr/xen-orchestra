import { findCopiedValues, findLabelledValues, findRowLabels, findTags } from '@/test/find-rendered-values.ts'
import { HOLD_LOADING } from '@/test/host-dashboard-card.ts'
import { t } from '@/test/i18n.ts'
import type { VueWrapper } from '@vue/test-utils'

type DashboardQuickInfoCase<TObject> = {
  // The object the card shows, in the test names, and its UUID once lowercased (`host` → `host-42`)
  objectName: string
  // The collection whose loading holds the rows, in the test name (`HOLD_LOADING`)
  loadingCollection: keyof typeof HOLD_LOADING
  rows: string[]
  createWithAddress: (uuid: string, ipAddress: string) => TObject
  // Omit it when the card renders its tags in its own way (e.g. an editable tags list) and test them separately
  createWithTags?: (tags: string[]) => TObject
}

/**
 * Registers the tests the quick info card of every object dashboard shares: a busy state while its collection loads,
 * its rows in order, the IP address and UUID to copy, its tags.
 */
export function itShowsDashboardQuickInfo<TObject>(
  mountQuickInfo: (object?: TObject) => VueWrapper,
  { objectName, loadingCollection, rows, createWithAddress, createWithTags }: DashboardQuickInfoCase<TObject>
) {
  it(`shows a busy state instead of the rows while the ${loadingCollection} are still loading`, () => {
    HOLD_LOADING[loadingCollection]()

    const wrapper = mountQuickInfo()

    expect(findLabelledValues(wrapper)).toEqual({})
  })

  it('lists every row of the card, in order', () => {
    const wrapper = mountQuickInfo()

    expect(findRowLabels(wrapper)).toEqual(rows)
  })

  it(`offers to copy the IP address and the UUID of the ${objectName}`, () => {
    const uuid = `${objectName.toLowerCase()}-42`

    const wrapper = mountQuickInfo(createWithAddress(uuid, '10.0.0.1'))

    expect(findCopiedValues(wrapper)).toEqual({ [t('ip-address')]: '10.0.0.1', [t('uuid')]: uuid })
  })

  if (createWithTags !== undefined) {
    it(`renders one tag per ${objectName} tag`, () => {
      const wrapper = mountQuickInfo(createWithTags(['production', 'billing']))

      expect(findTags(wrapper)).toEqual(['production', 'billing'])
    })
  }
}
