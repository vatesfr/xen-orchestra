import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { VM_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVm` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVm(overrides: Partial<FrontXoVm> = {}): FrontXoVm {
  return {
    id: 'vm-123' as FrontXoVm['id'],
    name_label: 'Test VM',
    name_description: 'A test virtual machine',
    power_state: VM_POWER_STATE.RUNNING,
    $container: 'host-456' as FrontXoVm['$container'],
    $pool: 'pool-789' as FrontXoVm['$pool'],
    other: {},
    current_operations: {},
    creation: {},
    CPUs: { max: 4, number: 2 },
    addresses: { '0/ipv4/0': '192.168.1.100' },
    tags: ['production'],
    os_version: null,
    virtualizationMode: 'hvm',
    secureBoot: false,
    VTPMs: [],
    VIFs: [],
    viridian: true,
    isNestedVirtEnabled: false,
    memory: {
      dynamic: [2 * ONE_GB, 4 * ONE_GB],
      size: 4 * ONE_GB,
      static: [2 * ONE_GB, 4 * ONE_GB],
    },
    VGPUs: [],
    high_availability: 'best-effort',
    auto_poweron: false,
    startDelay: 0,
    vga: 'qxl',
    videoram: 8,
    pvDriversVersion: '7.5.0',
    cpuWeight: 256,
    cpuCap: 0,
    cpuMask: [],
    coresPerSocket: 2,
    mainIpAddress: '192.168.1.100',
    nicType: 'rtl8139',
    affinityHost: undefined,
    suspendSr: undefined,
    // `XoVm` types this as a complete `Record<VM_OPERATIONS, string>`, while the API only sends the blocked ones
    blockedOperations: {} as FrontXoVm['blockedOperations'],
    hasVendorDevice: false,
    startTime: 1660000000,
    installTime: 1659900000,
    pvDriversDetected: true,
    pvDriversUpToDate: true,
    managementAgentDetected: true,
    type: 'VM',
    $VBDs: [],
    snapshots: [],
    boot: { order: 'cdn' },
    parent: undefined,
    ...overrides,
  }
}
