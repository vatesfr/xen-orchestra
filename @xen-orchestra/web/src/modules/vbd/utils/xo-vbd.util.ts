import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'
import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'

export function findScopedVbd(vbds: FrontXoVbd[], vm: FrontXoVm | undefined) {
  return vm ? vbds.find(vbd => vbd.VM === vm.id) : (vbds.find(vbd => vbd.attached) ?? vbds[0])
}
