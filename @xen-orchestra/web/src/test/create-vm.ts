import type { FrontXoVm } from '@/modules/vm/remote-resources/use-xo-vm-collection.ts'
import { VM_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoVm` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVm(overrides: Partial<FrontXoVm> = {}): FrontXoVm {
  return {
    id: 'vm-123',
    name_label: 'Test VM',
    name_description: 'A test virtual machine',
    power_state: VM_POWER_STATE.RUNNING,
    $container: 'host-456',
    $pool: 'pool-789',
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
      dynamic: [2147483648, 4294967296],
      size: 4294967296,
      static: [2147483648, 4294967296],
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
    blockedOperations: {},
    hasVendorDevice: false,
    startTime: 1660000000000,
    installTime: 1659900000000,
    pvDriversDetected: true,
    managementAgentDetected: true,
    type: 'VM',
    $VBDs: [],
    snapshots: [],
    boot: { order: 'cdn' },
    parent: undefined,
    ...overrides,
  } as FrontXoVm
}
