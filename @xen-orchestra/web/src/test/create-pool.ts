import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'

// A pool name apart from the `createPool` default, for a test telling two pools apart or naming the one of a V2V list
export const DISKOR_POOL_NAME = 'pool diskor'

// A pool id no pool collection knows: removed, or of another XO
export const UNKNOWN_POOL_ID = 'pool-unknown' as FrontXoPool['id']

/**
 * Builds a fully-populated `FrontXoPool` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPool(overrides: Partial<FrontXoPool> = {}): FrontXoPool {
  return {
    id: 'pool-789' as FrontXoPool['id'],
    name_label: 'Test Pool',
    name_description: 'A test pool',
    master: 'host-456' as FrontXoPool['master'],
    current_operations: {},
    default_SR: 'sr-123' as FrontXoPool['default_SR'],
    tags: [],
    otherConfig: {},
    auto_poweron: false,
    HA_enabled: false,
    migrationCompression: false,
    suspendSr: undefined,
    crashDumpSr: undefined,
    haSrs: [],
    type: 'pool',
    haRebootVmOnInternalShutdown: false,
    ...overrides,
  }
}
