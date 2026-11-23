import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import type {
  FrontXoVm,
  useXoVmCollection as realUseXoVmCollection,
} from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { extractVmHostId } from '@/modules/vm/utils/xo-vm.util.ts'
import { createMockCollection, findById } from '@/test/find-by-id.ts'
import { groupBy } from '@/test/group-by.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { computed, type MaybeRefOrGetter, ref } from 'vue'

// Shared state of the mocked VM collection: a test sets the VMs it needs, reset it in `beforeEach`
export const vmCollectionMock = {
  vms: ref<FrontXoVm[]>([]),
  areVmsReady: ref(true),
  hasVmFetchError: ref(false),
  // The `isEnabled` option the collection was last called with
  isEnabled: undefined as MaybeRefOrGetter<boolean> | undefined,
  reset() {
    this.vms.value = []
    this.areVmsReady.value = true
    this.hasVmFetchError.value = false
    this.isEnabled = undefined
  },
}

// Mocked with `mockXoVmCollection()`: As in the real collection, a VM is on the host of its `$container`, read from the hosts of `mock-xo-collections.ts`
export const useXoVmCollection = ((options?: { isEnabled?: MaybeRefOrGetter<boolean> }) => {
  vmCollectionMock.isEnabled = options?.isEnabled

  return {
    ...createMockCollection('Vm', 'Vms', vmCollectionMock.vms, vmCollectionMock.areVmsReady),
    hasVmFetchError: vmCollectionMock.hasVmFetchError,
    vmsByPool: computed(() => groupBy(vmCollectionMock.vms.value, vm => vm.$pool)),
    vmsByHost: computed(() =>
      groupBy(
        vmCollectionMock.vms.value.filter(vm => extractVmHostId(vm) !== undefined),
        vm => vm.$container as FrontXoHost['id']
      )
    ),
    getVmHost: (vm: FrontXoVm) => {
      const hostId = extractVmHostId(vm)

      return findById(xoCollectionsMock.hosts.value, hostId)
    },
  }
}) as unknown as typeof realUseXoVmCollection

// Replaces the module in every test of the file: call it at the top level of the test file
export function mockXoVmCollection() {
  mockModule(
    import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
    () => import('@/test/mock-xo-vm-collection.ts')
  )
}
