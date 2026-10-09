import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { useXoVdiCollection } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { useVmQueryBuilder } from '@/modules/vm/composables/use-vm-query-builder.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'

const { getVbdsByIds, getVdiById } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
  getVdiById: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

vi.mock(import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'), () => ({
  useXoVdiCollection: (() => ({ getVdiById })) as unknown as typeof useXoVdiCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()
  getVdiById.mockReset()
  getVbdsByIds.mockReturnValue([])
  getVdiById.mockReturnValue(undefined)
})

function createVmWithRam(id: string, ramSize: number) {
  return createVm({
    id: id as FrontXoVm['id'],
    memory: { size: ramSize, dynamic: [0, 0], static: [0, 0] },
  })
}

describe('items', () => {
  it('filters on the enhanced VM data', () => {
    const smallVm = createVmWithRam('vm-1', 2 * ONE_GB)
    const largeVm = createVmWithRam('vm-2', 8 * ONE_GB)

    const { wrapper } = mountComposable(() =>
      useVmQueryBuilder('vms', [smallVm, largeVm], { initialFilter: `ramSize:>${4 * ONE_GB}` })
    )

    expect(wrapper.vm.items.map(vm => vm.id)).toEqual([largeVm.id])
  })
})
