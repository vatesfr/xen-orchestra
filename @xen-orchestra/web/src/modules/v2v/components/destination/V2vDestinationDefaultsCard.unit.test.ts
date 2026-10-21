import V2vDestinationDefaultsCard from '@/modules/v2v/components/destination/V2vDestinationDefaultsCard.vue'
import { createSelectBindings } from '@/test/create-select-bindings.ts'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findSelectStubLabels } from '@/test/find-select-stub-labels.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard() {
  return mount(V2vDestinationDefaultsCard, {
    props: {
      poolName: 'diskor',
      srSelectBindings: createSelectBindings('SR'),
      networkSelectBindings: createSelectBindings('Network'),
      templateSelectBindings: createSelectBindings('Template'),
    },
    global: createGlobalTestConfig({ stubs: { FormSelect: true } }),
  })
}

it('shows its title with the pool name and how the defaults apply', () => {
  expect(findCardTitle(mountCard())).toBe(
    `${t('global-defaults-for-name', { name: 'diskor' })} ${t('v2v:global-defaults-info')}`
  )
})

it('lets the user choose the default SR, network and template, in this order', () => {
  expect(findSelectStubLabels(mountCard())).toEqual(['SR', 'Network', 'Template'])
})
