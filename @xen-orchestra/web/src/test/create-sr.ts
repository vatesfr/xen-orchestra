import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'

/**
 * Builds a fully-populated `FrontXoSr` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createSr(overrides: Partial<FrontXoSr> = {}): FrontXoSr {
  return {
    id: 'sr-123' as FrontXoSr['id'],
    name_label: 'Test SR',
    name_description: 'A test storage repository',
    $pool: 'pool-789' as FrontXoSr['$pool'],
    $container: 'host-456' as FrontXoSr['$container'],
    content_type: 'user',
    physical_usage: ONE_GB,
    usage: ONE_GB,
    size: 10 * ONE_GB,
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
  }
}
