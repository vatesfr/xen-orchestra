import V2vValueOrigin from '@/modules/v2v/components/mapping/V2vValueOrigin.vue'
import V2vVmOptionsCard from '@/modules/v2v/components/panel/V2vVmOptionsCard.vue'
import { findCardTitle } from '@/test/find-card-title.ts'
import { findLabelledValues } from '@/test/find-rendered-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { V2V_DEBIAN_TEMPLATE, V2V_MIGRATED_VM_TAGS, V2V_TARGET_OPTIONS } from '@/test/v2v-mapping-fixtures.ts'
import VtsTag from '@core/components/tag/VtsTag.vue'
import { mount } from '@vue/test-utils'
import type { ComponentProps } from 'vue-component-type-helpers'

const TEMPLATE = { value: V2V_DEBIAN_TEMPLATE.id, origin: 'overridden', isOffered: true } as const

function mountCard(props: Partial<ComponentProps<typeof V2vVmOptionsCard>> = {}) {
  return mount(V2vVmOptionsCard, {
    props: {
      keepMac: true,
      template: TEMPLATE,
      templateOptions: V2V_TARGET_OPTIONS.templates,
      tags: V2V_MIGRATED_VM_TAGS,
      ...props,
    },
    global: createGlobalTestConfig(),
  })
}

it('shows its title', () => {
  expect(findCardTitle(mountCard())).toBe(t('options'))
})

it.each([
  [true, 'enabled'],
  [false, 'disabled'],
] as const)('tells whether the MAC addresses are kept (%s)', (keepMac, statusKey) => {
  expect(findLabelledValues(mountCard({ keepMac }))[t('keep-mac-addresses')]).toBe(t(statusKey))
})

it('names the template, and where it comes from, without a reset', () => {
  const wrapper = mountCard()

  expect(findLabelledValues(wrapper)[t('template')]).toBe(`${V2V_DEBIAN_TEMPLATE.name_label} ${t('overridden')}`)
  expect(wrapper.getComponent(V2vValueOrigin).props()).toEqual({ origin: 'overridden', readonly: true })
})

it('names a template the pool does not offer, or not yet, by its id', () => {
  expect(findLabelledValues(mountCard({ templateOptions: [] }))[t('template')]).toBe(
    `${V2V_DEBIAN_TEMPLATE.id} ${t('overridden')}`
  )
})

it('lists the tags of the VM', () => {
  const tags = mountCard({ tags: ['web', 'prod'] })
    .findAllComponents(VtsTag)
    .map(tag => tag.props('value'))

  expect(tags).toEqual(['web', 'prod'])
})

it('lists no tag for a VM without any', () => {
  expect(mountCard({ tags: [] }).findAllComponents(VtsTag)).toEqual([])
})
