import type { FrontXoVmController } from '@/modules/vm/remote-resources/use-xo-vm-controller-collection.ts'
import { VM_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVmController` — the control domain of a host
 * — for use in tests. Pass `overrides` to tweak only the fields relevant to the
 * case under test.
 */
export function createVmController(overrides: Partial<FrontXoVmController> = {}): FrontXoVmController {
  return {
    id: 'vm-controller-123' as FrontXoVmController['id'],
    name_label: 'Control domain on host Test Host',
    power_state: VM_POWER_STATE.RUNNING,
    memory: {
      dynamic: [2147483648, 2147483648],
      size: 2147483648,
      static: [1073741824, 2147483648],
    },
    $container: 'host-456' as FrontXoVmController['$container'],
    type: 'VM-controller',
    ...overrides,
  }
}
