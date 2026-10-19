import InlineParts from '@/shared/components/InlineParts.vue'
import { findParts } from '@/test/find-parts.ts'
import { mount } from '@vue/test-utils'
import { h } from 'vue'

function mountParts(parts: string[]) {
  return mount(InlineParts, {
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
