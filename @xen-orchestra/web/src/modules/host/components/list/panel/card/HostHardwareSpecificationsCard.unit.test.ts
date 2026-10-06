import HostHardwareSpecificationsCard from '@/modules/host/components/list/panel/card/HostHardwareSpecificationsCard.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import VtsCopyButton from '@core/components/copy-button/VtsCopyButton.vue'
import { mount } from '@vue/test-utils'

function mountCard(host: FrontXoHost = createHost()) {
  return mount(HostHardwareSpecificationsCard, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountCard()

  expect(wrapper.get('.ui-card-title').text()).toBe(t('hardware-specifications'))
})

it('shows the manufacturer and the core layout of the host', () => {
  const wrapper = mountCard(
    createHost({
      bios_strings: { 'system-manufacturer': 'Dell', 'system-product-name': 'PowerEdge R640' },
      cpus: { cores: 16, sockets: 2 },
    })
  )

  expect(findCardLabelledValues(wrapper)).toEqual({
    [t('manufacturer-info')]: 'Dell (PowerEdge R640)',
    [t('core-socket')]: '16 (2)',
  })
})

it('leaves out the product name when the host does not report one', () => {
  const wrapper = mountCard(createHost({ bios_strings: { 'system-manufacturer': 'Dell' } }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('manufacturer-info')]: 'Dell' })
})

it('falls back to zero cores and sockets when the host reports neither', () => {
  const wrapper = mountCard(createHost({ cpus: {} }))

  expect(findCardLabelledValues(wrapper)).toMatchObject({ [t('core-socket')]: '0 (0)' })
})

it('offers to copy each specification as it is shown', () => {
  const wrapper = mountCard(
    createHost({
      bios_strings: { 'system-manufacturer': 'Dell', 'system-product-name': 'PowerEdge R640' },
      cpus: { cores: 16, sockets: 2 },
    })
  )

  expect(wrapper.findAllComponents(VtsCopyButton).map(button => button.props('value'))).toEqual([
    'Dell (PowerEdge R640)',
    '16 (2)',
  ])
})
