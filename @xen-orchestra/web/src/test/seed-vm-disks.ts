import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { createVbd } from '@/test/create-vbd.ts'
import { createVdi } from '@/test/create-vdi.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'

/**
 * Seeds the mocked VBD and VDI collections (`mock-xo-vm-device-collections.ts`) with the disks of a VM, the n-th
 * disk as VBD `vbd-<n>` on VDI `vdi-<n>` unless its overrides tell otherwise, and returns the `$VBDs` of that VM. A
 * disk without `vdi` points to a VDI the collection does not know.
 */
export function seedVmDisks(disks: { vbd?: Partial<FrontXoVbd>; vdi?: Partial<FrontXoVdi> }[]): FrontXoVm['$VBDs'] {
  const vdiIds = disks.map(({ vdi }, index) => vdi?.id ?? (`vdi-${index}` as FrontXoVdi['id']))

  const vbds = disks.map(({ vbd }, index) =>
    createVbd({ id: `vbd-${index}` as FrontXoVbd['id'], VDI: vdiIds[index], ...vbd })
  )

  vmDeviceCollectionsMock.vbds.value = vbds
  vmDeviceCollectionsMock.vdis.value = disks.flatMap(({ vdi }, index) =>
    vdi === undefined ? [] : [createVdi({ ...vdi, id: vdiIds[index] })]
  )

  return vbds.map(vbd => vbd.id)
}
