import { useV2vSourceStats } from '@/modules/v2v/composables/use-v2v-source-stats.composable.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createV2vImportVm } from '@/test/create-v2v-import-vm.ts'
import { V2V_TEST_SOURCE } from '@/test/create-v2v-inventory.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { type MaybeRefOrGetter, nextTick, ref } from 'vue'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})

function mountSourceStats(sourceId: MaybeRefOrGetter<string | undefined>) {
  return mountComposable(() => ({ stats: useV2vSourceStats(sourceId) })).wrapper.vm
}

it('counts the warm and cold imports of the source', () => {
  vmCollectionMock.vms.value = [
    createV2vImportVm({ isWarm: false }, { id: 'xo-vm-1' as FrontXoVm['id'] }),
    createV2vImportVm({ isWarm: true }, { id: 'xo-vm-2' as FrontXoVm['id'] }),
    createV2vImportVm({ sourceId: 'other-vcenter' }, { id: 'xo-vm-3' as FrontXoVm['id'] }),
  ]

  expect(mountSourceStats(V2V_TEST_SOURCE.instanceUuid).stats).toEqual({ warm: 1, cold: 1 })
})

it('has no stats for a source never connected to', () => {
  expect(mountSourceStats(undefined).stats).toBeUndefined()
})

it('has no stats while the VMs are loading', () => {
  vmCollectionMock.areVmsReady.value = false

  expect(mountSourceStats(V2V_TEST_SOURCE.instanceUuid).stats).toBeUndefined()
})

it('follows a source change', async () => {
  vmCollectionMock.vms.value = [createV2vImportVm({ sourceId: 'vcenter-uuid-2' })]
  const sourceId = ref<string>(V2V_TEST_SOURCE.instanceUuid)
  const result = mountSourceStats(sourceId)

  sourceId.value = 'vcenter-uuid-2'
  await nextTick()

  expect(result.stats).toEqual({ warm: 1, cold: 0 })
})

it('follows a VM turning cold', async () => {
  vmCollectionMock.vms.value = [createV2vImportVm({ isWarm: true })]
  const result = mountSourceStats(V2V_TEST_SOURCE.instanceUuid)

  vmCollectionMock.vms.value = [createV2vImportVm({ isWarm: false })]
  await nextTick()

  expect(result.stats).toEqual({ warm: 0, cold: 1 })
})
