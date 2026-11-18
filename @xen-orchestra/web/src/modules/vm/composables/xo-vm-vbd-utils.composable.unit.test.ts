import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import { useXoVmVbdsUtils } from '@/modules/vm/composables/xo-vm-vbd-utils.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVm } from '@/test/create-vm.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { seedVmDisks } from '@/test/seed-vm-disks.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { ref } from 'vue'

mockModule(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

beforeEach(() => {
  vmDeviceCollectionsMock.reset()
})

describe('notCdDriveVbds', () => {
  it('filters out the CD-drive VBDs', () => {
    const vm = createVm({ $VBDs: seedVmDisks([{ vbd: { is_cd_drive: false } }, { vbd: { is_cd_drive: true } }]) })

    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(1)
    expect(wrapper.vm.notCdDriveVbds[0].is_cd_drive).toBe(false)
  })

  it('reacts to changes of the source VM', () => {
    vmDeviceCollectionsMock.vbds.value = [
      createVbd({ id: 'vbd-disk' as FrontXoVbd['id'], is_cd_drive: false }),
      createVbd({ id: 'vbd-cd' as FrontXoVbd['id'], is_cd_drive: true }),
    ]

    const vm = ref(createVm({ $VBDs: ['vbd-disk'] as FrontXoVm['$VBDs'] }))
    const { wrapper } = mountComposable(() => useXoVmVbdsUtils(vm))

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(1)

    vm.value = createVm({ $VBDs: ['vbd-cd'] as FrontXoVm['$VBDs'] })

    expect(wrapper.vm.notCdDriveVbds).toHaveLength(0)
  })
})
