import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

/**
 * Builds a fully-populated `FrontXoPool` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPool(overrides: Partial<FrontXoPool> = {}): FrontXoPool {
  return {
    id: 'pool-789',
    name_label: 'Test Pool',
    name_description: 'A test pool',
    master: 'host-456',
    default_SR: 'sr-123',
    tags: [],
    otherConfig: {},
    auto_poweron: false,
    HA_enabled: false,
    migrationCompression: false,
    suspendSr: null,
    crashDumpSr: null,
    haSrs: [],
    type: 'pool',
    haRebootVmOnInternalShutdown: false,
    ...overrides,
  } as FrontXoPool
}
