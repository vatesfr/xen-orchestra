import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { HOST_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoHost` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createHost(overrides: Partial<FrontXoHost> = {}): FrontXoHost {
  return {
    id: 'host-456',
    name_label: 'Test Host',
    name_description: 'A test host',
    power_state: HOST_POWER_STATE.RUNNING,
    controlDomain: 'vm-controller-123',
    residentVms: [],
    $pool: 'pool-789',
    current_operations: {},
    address: '192.168.1.1',
    startTime: 1660000000000,
    version: '8.2.0',
    bios_strings: {},
    cpus: { cores: 8, sockets: 2 },
    CPUs: {},
    memory: { size: 4294967296, usage: 2147483648 },
    tags: [],
    iscsiIqn: '',
    powerOnMode: '',
    build: 'release/yangtze/master/1',
    otherConfig: {},
    multipathing: false,
    logging: {},
    enabled: true,
    agentStartTime: 1660000000000,
    PGPUs: [],
    type: 'host',
    ...overrides,
  } as FrontXoHost
}
