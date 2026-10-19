import V2vDestinationPoolCard from '@/modules/v2v/components/destination/V2vDestinationPoolCard.vue'
import { createSelectBindings } from '@/test/create-select-bindings.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findSelectStubLabels } from '@/test/find-select-stub-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

const POOL_SELECT_BINDINGS = createSelectBindings('Destination pool')

function mountCard() {
  return mount(V2vDestinationPoolCard, {
    props: { poolSelectBindings: POOL_SELECT_BINDINGS },
    global: createGlobalTestConfig({ stubs: { FormSelect: true } }),
  })
}

it('shows its title and that a migration goes to one pool', () => {
  expect(findCardTitle(mountCard())).toBe(`${t('destination-pool')} ${t('v2v:destination-pool-info')}`)
})

it('lets the user choose the pool', () => {
  expect(findSelectStubLabels(mountCard())).toEqual([POOL_SELECT_BINDINGS.label])
})
