import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'

/**
 * Builds a fully-populated `FrontXoSr` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createSr(overrides: Partial<FrontXoSr> = {}): FrontXoSr {
  return {
    id: 'sr-123',
    name_label: 'Test SR',
    name_description: 'A test storage repository',
    $pool: 'pool-789',
    $container: 'host-456',
    content_type: 'user',
    physical_usage: 1073741824,
    usage: 1073741824,
    size: 10737418240,
    SR_type: 'lvm',
    VDIs: [],
    type: 'SR',
    shared: false,
    sm_config: {},
    other_config: {},
    tags: [],
    allocationStrategy: 'thin',
    $PBDs: [],
    ...overrides,
  } as FrontXoSr
}
