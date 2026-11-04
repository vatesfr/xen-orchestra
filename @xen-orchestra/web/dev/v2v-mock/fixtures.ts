import type { XoV2vInventory, XoV2vVm } from '@vates/types'
import { createV2vInventory, createV2vVm } from '../../src/test/create-v2v-inventory.ts'

const VCENTER_VM_COUNT = 148

const ESXI_VM_COUNT = 9

function createVm(index: number): XoV2vVm {
  return createV2vVm({
    id: `vm-${index + 100}` as XoV2vVm['id'],
    instanceUuid: `vm-instance-${index + 100}`,
    name: `app-${String(index + 1).padStart(3, '0')}`,
  })
}

export function createMockInventory(host: string): XoV2vInventory {
  const isVcenter = host.includes('vcenter')

  return createV2vInventory({
    product: isVcenter ? 'VMware vCenter Server' : 'VMware ESXi',
    version: isVcenter ? '8.0.2' : '7.0.3',
    instanceUuid: isVcenter ? 'mock-vcenter-instance-uuid' : undefined,
    vms: Array.from({ length: isVcenter ? VCENTER_VM_COUNT : ESXI_VM_COUNT }, (_, index) => createVm(index)),
  })
}
