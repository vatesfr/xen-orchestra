import type { FrontXoHost } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { HOST_POWER_STATE } from '@vates/types'

/**
 * Builds a fully-populated `FrontXoHost` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createHost(overrides: Partial<FrontXoHost> = {}): FrontXoHost {
  return {
    id: 'host-456' as FrontXoHost['id'],
    name_label: 'Test Host',
    name_description: 'A test host',
    power_state: HOST_POWER_STATE.RUNNING,
    controlDomain: 'vm-controller-123' as FrontXoHost['controlDomain'],
    residentVms: [],
    $pool: 'pool-789' as FrontXoHost['$pool'],
    current_operations: {},
    address: '192.168.1.1',
    startTime: 1660000000,
    version: '8.2.0',
    bios_strings: {},
    cpus: { cores: 8, sockets: 2 },
    CPUs: {},
    memory: { size: 4 * ONE_GB, usage: 2 * ONE_GB },
    tags: [],
    iscsiIqn: '',
    powerOnMode: '',
    build: 'release/yangtze/master/1',
    otherConfig: {},
    multipathing: false,
    logging: {},
    enabled: true,
    agentStartTime: 1660000000,
    PGPUs: [],
    type: 'host',
    ...overrides,
  }
}
