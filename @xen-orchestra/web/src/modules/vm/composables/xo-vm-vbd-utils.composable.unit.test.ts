import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { getVbdsByIds } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds })) as unknown as typeof useXoVbdCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()
})

describe('notCdDriveVbds', () => {
  test('filters out the CD-drive VBDs', () => {
    getVbdsByIds.mockReturnValue([createVbd({ is_cd_drive: false }), createVbd({ is_cd_drive: true })])

    const { result } = mountComposable(() => useXoVmVbdsUtils(createVm()))

    expect(result.notCdDriveVbds.value).toHaveLength(1)
    expect(result.notCdDriveVbds.value[0].is_cd_drive).toBe(false)
  })

  test('reacts to changes of the source VM', () => {
    getVbdsByIds.mockImplementation((ids: string[]) =>
      ids.includes('vbd-cd') ? [createVbd({ is_cd_drive: true })] : [createVbd({ is_cd_drive: false })]
    )

    const vm = ref(createVm({ $VBDs: ['vbd-disk'] as FrontXoVm['$VBDs'] }))
    const { result } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(result.notCdDriveVbds.value).toHaveLength(1)

    vm.value = createVm({ $VBDs: ['vbd-cd'] as FrontXoVm['$VBDs'] })

    expect(result.notCdDriveVbds.value).toHaveLength(0)
  })
})
