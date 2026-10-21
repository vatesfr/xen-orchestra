import type { FrontXoVif } from '@/modules/vif/remote-resources/use-xo-vif-collection.ts'
import { VIF_LOCKING_MODE } from '@vates/types'

export function createVif(overrides: Partial<FrontXoVif> = {}): FrontXoVif {
  return {
    id: 'vif-1' as FrontXoVif['id'],
    $VM: 'vm-123' as FrontXoVif['$VM'],
    $network: 'network-123' as FrontXoVif['$network'],
    $pool: 'pool-789' as FrontXoVif['$pool'],
    attached: true,
    device: '0',
    txChecksumming: true,
    lockingMode: VIF_LOCKING_MODE.NETWORK_DEFAULT,
    MAC: '00:50:56:00:00:01',
    MTU: 1500,
    rateLimit: undefined,
    type: 'VIF',
    other_config: {},
    ...overrides,
  }
}
