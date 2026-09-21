import type { FrontXoSm } from '@/modules/sm/remote-resources/use-xo-sm-collection.ts'

/**
 * Builds a fully-populated `FrontXoSm` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createSm(overrides: Partial<FrontXoSm> = {}): FrontXoSm {
  return {
    id: 'sm-123' as FrontXoSm['id'],
    $pool: 'pool-789' as FrontXoSm['$pool'],
    SM_type: 'lvm',
    supported_image_formats: [],
    ...overrides,
  }
}
