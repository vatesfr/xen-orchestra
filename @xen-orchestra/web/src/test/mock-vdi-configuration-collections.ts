import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createSr } from '@/test/create-sr.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { createVm } from '@/test/create-vm.ts'
import { mockXoCollections, xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockXoVmCollection, vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mockXoVmDeviceCollections, vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'

// The name of the SR every test starts with: the one `createVdi()` and `createVdiSnapshot()` live on
export const VDI_SR_NAME = 'Local storage'

/**
 * Mocks the collections `useVdiConfiguration` reads, and the `SrLink` it feeds: the SRs with their PBDs, hosts and
 * pools, the VBDs and the VMs. Call it at the top level of the test file: before each test, they are reset and hold
 * the SR of `createVdi()`, named `VDI_SR_NAME`.
 */
export function mockVdiConfigurationCollections() {
  mockXoCollections('host', 'pbd', 'pool', 'sr')
  mockXoVmDeviceCollections('vbd')
  mockXoVmCollection()

  beforeEach(() => {
    xoCollectionsMock.reset()
    vmDeviceCollectionsMock.reset()
    vmCollectionMock.reset()

    xoCollectionsMock.srs.value = [createSr({ id: createVdi().$SR, name_label: VDI_SR_NAME })]
  })
}

/**
 * Seeds the VMs a VDI is plugged into, the n-th VM as `vm-<n>` through VBD `vbd-<n>`, and returns the `$VBDs` to give
 * that VDI.
 */
export function seedVdiVms(...names: string[]): FrontXoVdi['$VBDs'] {
  const vms = names.map((name, index) => createVm({ id: `vm-${index}` as FrontXoVm['id'], name_label: name }))

  const vbds = vms.map((vm, index) => createVbd({ id: `vbd-${index}` as FrontXoVbd['id'], VM: vm.id }))

  vmCollectionMock.vms.value = vms
  vmDeviceCollectionsMock.vbds.value = vbds

  return vbds.map(vbd => vbd.id)
}
