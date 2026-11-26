import HostHardwareSpecificationsCard from '@/modules/host/components/list/panel/card/HostHardwareSpecificationsCard.vue'
import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { itRendersCardTitle } from '@/test/card-title.ts'
import { createHost } from '@/test/create-host.ts'
import { findCardCopiedValues, findCardLabelledValues } from '@/test/find-rendered-values.ts'
import { findPanelCardTitleLabel } from '@/test/find-titles.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'

function mountCard(host: FrontXoHost = createHost()) {
  return mount(HostHardwareSpecificationsCard, {
    props: { host },
    global: createGlobalTestConfig(),
  })
}

itRendersCardTitle(mountCard, t('hardware-specifications'), findPanelCardTitleLabel)

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

  expect(findCardCopiedValues(wrapper)).toEqual(['Dell (PowerEdge R640)', '16 (2)'])
})
