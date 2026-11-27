import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { findTags } from '@/test/find-rendered-values.ts'
import type { VueWrapper } from '@vue/test-utils'

// Registers the tag order test of a VM card, the card mounted by `mountCard` on a VM
export function itShowsVmTagsSorted(mountCard: (vm: FrontXoVm) => VueWrapper) {
  it('renders one tag per VM tag, in alphabetical order', () => {
    const wrapper = mountCard(createVm({ tags: ['production', 'billing'] }))

    expect(findTags(wrapper)).toEqual(['billing', 'production'])
  })
}
