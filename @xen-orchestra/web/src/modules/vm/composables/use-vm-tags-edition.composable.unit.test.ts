import { useVmTagsEdition } from '@/modules/vm/composables/use-vm-tags-edition.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import type { fetchDelete, fetchPut } from '@/shared/utils/fetch.util.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'

const { put, remove } = vi.hoisted(() => ({
  put: vi.fn(),
  remove: vi.fn(),
}))

vi.mock(import('@/shared/utils/fetch.util.ts'), () => ({
  fetchPut: put as unknown as typeof fetchPut,
  fetchDelete: remove as unknown as typeof fetchDelete,
}))

beforeEach(() => {
  put.mockReset()
  remove.mockReset()

  put.mockResolvedValue(undefined)
  remove.mockResolvedValue(undefined)
})

const vm = createVm({ id: 'vm-42' as FrontXoVm['id'], tags: ['production', 'web'] })

const failure = new Error('VM unreachable')

function mountTagsEdition() {
  return mountComposable(() => useVmTagsEdition(vm)).wrapper
}

describe('saveTags', () => {
  it('adds the added tags and removes the removed ones', async () => {
    const wrapper = mountTagsEdition()

    await wrapper.vm.saveTags({ added: ['db', 'analytics'], removed: ['web'] })

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db'], ['vms/vm-42/tags/analytics']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })

  it('applies the changes of each save', async () => {
    const wrapper = mountTagsEdition()

    await wrapper.vm.saveTags({ added: ['db'], removed: [] })
    await wrapper.vm.saveTags({ added: [], removed: ['web'] })

    expect(put.mock.calls).toEqual([['vms/vm-42/tags/db']])
    expect(remove.mock.calls).toEqual([['vms/vm-42/tags/web']])
  })
})

describe('isSaving', () => {
  it('is true until every change has settled', async () => {
    let resolvePut = () => {}

    put.mockReturnValue(
      new Promise<void>(resolve => {
        resolvePut = resolve
      })
    )

    const wrapper = mountTagsEdition()

    expect(wrapper.vm.isSaving).toBe(false)

    const saving = wrapper.vm.saveTags({ added: ['db'], removed: ['web'] })
    await flushPromises()

    expect(wrapper.vm.isSaving).toBe(true)

    resolvePut()
    await saving

    expect(wrapper.vm.isSaving).toBe(false)
  })

  it('is false again once a change has failed', async () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    put.mockRejectedValue(failure)

    const wrapper = mountTagsEdition()

    await wrapper.vm.saveTags({ added: ['db'], removed: [] })

    expect(wrapper.vm.isSaving).toBe(false)
  })
})
