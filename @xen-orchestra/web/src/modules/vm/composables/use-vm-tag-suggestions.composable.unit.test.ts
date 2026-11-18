import { useVmTagSuggestions } from '@/modules/vm/composables/use-vm-tag-suggestions.composable.ts'
import type { FrontXoVm, useXoVmCollection } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVm } from '@/test/create-vm.ts'
import { t } from '@/test/i18n.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const vms = ref<FrontXoVm[]>([])

vi.mock(import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'), () => ({
  useXoVmCollection: (() => ({ vms })) as unknown as typeof useXoVmCollection,
}))

function mountTagSuggestions(vmsTags: string[][]) {
  vms.value = vmsTags.map(tags => createVm({ tags }))

  return mountComposable(() => useVmTagSuggestions()).wrapper
}

describe('tagSuggestions', () => {
  it('suggests every tag used on the VMs once, with the number of VMs using it', () => {
    const wrapper = mountTagSuggestions([['production', 'web'], ['production'], ['production', 'db']])

    expect(wrapper.vm.tagSuggestions).toEqual([
      { tag: 'production', info: t('n-vms', 3) },
      { tag: 'web', info: t('n-vms', 1) },
      { tag: 'db', info: t('n-vms', 1) },
    ])
  })

  it('suggests nothing when no VM has a tag', () => {
    const wrapper = mountTagSuggestions([[], []])

    expect(wrapper.vm.tagSuggestions).toEqual([])
  })

  it('follows the tags of the VMs', () => {
    const wrapper = mountTagSuggestions([['production']])

    vms.value = [createVm({ tags: ['production'] }), createVm({ tags: ['production', 'staging'] })]

    expect(wrapper.vm.tagSuggestions).toEqual([
      { tag: 'production', info: t('n-vms', 2) },
      { tag: 'staging', info: t('n-vms', 1) },
    ])
  })
})
