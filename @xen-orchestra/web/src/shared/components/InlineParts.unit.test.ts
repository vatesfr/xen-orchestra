import InlineParts from '@/shared/components/InlineParts.vue'
import { findParts } from '@/test/find-parts.ts'
import { mount } from '@vue/test-utils'
import { h } from 'vue'
import type { ComponentProps } from 'vue-component-type-helpers'

function mountParts(parts: string[], props: ComponentProps<typeof InlineParts> = {}) {
  return mount(InlineParts, {
    props,
    attrs: { class: 'details' },
    slots: { default: () => parts.map(part => h('span', part)) },
  })
}

it('lays out each part in order', () => {
  expect(findParts(mountParts(['vcenter.lab', '148 VMs']), '.details')).toEqual(['vcenter.lab', '148 VMs'])
})

it('lays out no part without content', () => {
  expect(findParts(mountParts([]), '.details')).toEqual([])
})

// The separator itself is CSS: only the variant that draws it can be read
it.each([
  ['bullets by default', undefined, false],
  ['chevrons for a location', 'chevron', true],
] as const)('separates the parts with %s', (_, separator, isChevron) => {
  expect(mountParts(['vcenter.lab', 'DC-Paris'], { separator }).classes('chevron')).toBe(isChevron)
})
