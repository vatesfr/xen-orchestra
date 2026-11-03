import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { toVmQueryPreviewItem } from '@/modules/vm/utils/xo-vm-query-preview-item.util.ts'
import { objectIcon } from '@core/icons'
import { VM_POWER_STATE } from '@vates/types'

const VM_ID = 'vm-1' as FrontXoVm['id']

describe('toVmQueryPreviewItem', () => {
  it('links to the VM dashboard', () => {
    expect(toVmQueryPreviewItem(VM_ID, 'Web server', VM_POWER_STATE.RUNNING)).toEqual({
      id: VM_ID,
      label: 'Web server',
      icon: objectIcon('vm', 'running'),
      route: `/vm/${VM_ID}/dashboard`,
    })
  })

  it('shows the power state of the VM in its icon', () => {
    expect(toVmQueryPreviewItem(VM_ID, 'Web server', VM_POWER_STATE.HALTED).icon).toBe(objectIcon('vm', 'halted'))
  })

  it('shows an unknown VM icon without power state', () => {
    expect(toVmQueryPreviewItem(VM_ID, 'Web server', undefined).icon).toBe('object:vm:unknown')
  })
})
