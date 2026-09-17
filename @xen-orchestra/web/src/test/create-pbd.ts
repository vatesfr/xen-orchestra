import type { FrontXoPbd } from '@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'

/**
 * Builds a fully-populated `FrontXoPbd` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPbd(overrides: Partial<FrontXoPbd> = {}): FrontXoPbd {
  return {
    id: 'pbd-123' as FrontXoPbd['id'],
    type: 'PBD',
    attached: true,
    host: 'host-456' as FrontXoPbd['host'],
    SR: 'sr-123' as FrontXoPbd['SR'],
    device_config: { location: '/dev/sdb' },
    otherConfig: {},
    $pool: 'pool-789' as FrontXoPbd['$pool'],
    ...overrides,
  }
}
