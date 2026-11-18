import { useVmEnhancedData } from '@/modules/vm/composables/use-vm-enhanced-data.composable.ts'
import { createEnhancedDataHelpers } from '@/test/create-enhanced-data-helpers.ts'
import { createVm } from '@/test/create-vm.ts'
import { vmDeviceCollectionsMock } from '@/test/mock-xo-vm-device-collections.ts'
import { seedVmDisks } from '@/test/seed-vm-disks.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { VM_OPERATIONS, VM_POWER_STATE } from '@vates/types'
import { ref } from 'vue'

mockModule(
  import('@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

mockModule(
  import('@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'),
  () => import('@/test/mock-xo-vm-device-collections.ts')
)

beforeEach(() => {
  vmDeviceCollectionsMock.reset()
})

const { mountEnhancedData, mountFirstFilterable, mountFirstDisplayData } = createEnhancedDataHelpers(
  useVmEnhancedData,
  result => result.filterableVms,
  createVm
)

describe('filterableVms', () => {
  it('exposes the raw RAM size from the VM memory', () => {
    const filterableVm = mountFirstFilterable([
      createVm({ memory: { size: 2147483648, dynamic: [0, 0], static: [0, 0] } }),
    ])

    expect(filterableVm.ramSize).toBe(2147483648)
  })

  it('sums the disk space from each VBD-linked VDI', () => {
    const filterableVm = mountFirstFilterable([
      createVm({ $VBDs: seedVmDisks([{ vdi: { size: 1000 } }, { vdi: { size: 2000 } }]) }),
    ])

    expect(filterableVm.diskSpaceSize).toBe(3000)
  })

  it('ignores VBDs whose VDI cannot be resolved', () => {
    const filterableVm = mountFirstFilterable([createVm({ $VBDs: seedVmDisks([{ vdi: { size: 1500 } }, {}]) })])

    expect(filterableVm.diskSpaceSize).toBe(1500)
  })

  it('exposes the sorted IP addresses of the VM', () => {
    const filterableVm = mountFirstFilterable([
      createVm({ addresses: { '0/ipv4/0': '10.0.0.2', '0/ipv4/1': '10.0.0.1' } }),
    ])

    expect(filterableVm.ipAddresses).toEqual(['10.0.0.1', '10.0.0.2'])
  })

  it('recomputes when the source VMs change', () => {
    const vms = ref([createVm({ memory: { size: 1073741824, dynamic: [0, 0], static: [0, 0] } })])
    const result = mountEnhancedData(vms)

    expect(result.filterableVms[0].ramSize).toBe(1073741824)

    vms.value = [createVm({ memory: { size: 4294967296, dynamic: [0, 0], static: [0, 0] } })]

    expect(result.filterableVms[0].ramSize).toBe(4294967296)
  })
})

describe('getDisplayData', () => {
  it('formats the raw RAM size for display', () => {
    const size = 2147483648
    const displayData = mountFirstDisplayData([createVm({ memory: { size, dynamic: [0, 0], static: [0, 0] } })])

    expect(displayData.formattedRam).toEqual(formatSizeRaw(size, 1))
  })

  it('formats the summed disk space for display', () => {
    const displayData = mountFirstDisplayData([createVm({ $VBDs: seedVmDisks([{ vdi: { size: 5000 } }]) })])

    expect(displayData.formattedDiskSpace).toEqual(formatSizeRaw(5000, 1))
  })

  it('derives the VM icon from the lowercased power state', () => {
    const displayData = mountFirstDisplayData([createVm({ power_state: VM_POWER_STATE.RUNNING })])

    expect(displayData.vmIcon).toBe(objectIcon('vm', 'running'))
  })

  it('maps the VM icon to the halted state when the VM is halted', () => {
    const displayData = mountFirstDisplayData([createVm({ power_state: VM_POWER_STATE.HALTED })])

    expect(displayData.vmIcon).toBe(objectIcon('vm', 'halted'))
  })

  it('maps the VM icon to the busy state while the VM power state is changing', () => {
    const displayData = mountFirstDisplayData([
      createVm({ power_state: VM_POWER_STATE.RUNNING, current_operations: { 'task-1': VM_OPERATIONS.CLEAN_REBOOT } }),
    ])

    expect(displayData.vmIcon).toBe(objectIcon('vm', 'busy'))
  })
})
