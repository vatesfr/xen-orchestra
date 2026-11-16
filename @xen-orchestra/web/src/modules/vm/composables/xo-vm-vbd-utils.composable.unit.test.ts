import type { useXoVbdCollection } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVm } from '@/test/create-vm.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { ref } from 'vue'

const { getVbdsByIds, areVbdsReady } = vi.hoisted(() => ({
  getVbdsByIds: vi.fn(),
  areVbdsReady: { value: true },
}))

vi.mock(import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'), () => ({
  useXoVbdCollection: (() => ({ getVbdsByIds, areVbdsReady })) as unknown as typeof useXoVbdCollection,
}))

beforeEach(() => {
  getVbdsByIds.mockReset()
  areVbdsReady.value = true
})

describe('notCdDriveVbds', () => {
  it('filters out the CD-drive VBDs', () => {
    getVbdsByIds.mockReturnValue([createVbd({ is_cd_drive: false }), createVbd({ is_cd_drive: true })])

    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(createVm()))

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(1)
    expect(wrapper.vm.notCdDriveVbds[0].is_cd_drive).toBe(false)
  })

  it('reacts to changes of the source VM', () => {
    getVbdsByIds.mockImplementation((ids: string[]) =>
      ids.includes('vbd-cd') ? [createVbd({ is_cd_drive: true })] : [createVbd({ is_cd_drive: false })]
    )

    const vm = ref(createVm({ $VBDs: ['vbd-disk'] as FrontXoVm['$VBDs'] }))
    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(1)

    vm.value = createVm({ $VBDs: ['vbd-cd'] as FrontXoVm['$VBDs'] })

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(0)
  })
})

describe('cdDriveVbds', () => {
  it('keeps only the CD-drive VBDs', () => {
    getVbdsByIds.mockReturnValue([createVbd({ is_cd_drive: false }), createVbd({ is_cd_drive: true })])

    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(createVm()))

    expect(wrapper.vm.cdDriveVbds).toHaveLength(1)
    expect(wrapper.vm.cdDriveVbds[0].is_cd_drive).toBe(true)
  })
})

describe('areVmVbdsReady', () => {
  it('is true once the collection has every VBD of the VM', () => {
    getVbdsByIds.mockReturnValue([createVbd(), createVbd()])

    const vm = createVm({ $VBDs: ['vbd-1', 'vbd-2'] as FrontXoVm['$VBDs'] })
    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(wrapper.vm.areVmVbdsReady).toBe(true)
  })

  it('is false while the collection is not ready', () => {
    areVbdsReady.value = false
    getVbdsByIds.mockReturnValue([])

    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(createVm({ $VBDs: [] as FrontXoVm['$VBDs'] })))

    expect(wrapper.vm.areVmVbdsReady).toBe(false)
  })

  it('is false while some VBDs of the VM are missing from the collection', () => {
    getVbdsByIds.mockReturnValue([createVbd()])

    const vm = createVm({ $VBDs: ['vbd-1', 'vbd-2'] as FrontXoVm['$VBDs'] })
    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(wrapper.vm.areVmVbdsReady).toBe(false)
  })
})
