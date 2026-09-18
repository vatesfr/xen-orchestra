import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'

/**
 * Builds a fully-populated `FrontXoVdi` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVdi(overrides: Partial<FrontXoVdi> = {}): FrontXoVdi {
  return {
    id: 'vdi-1' as FrontXoVdi['id'],
    name_label: 'Test VDI',
    name_description: 'A test virtual disk image',
    $VBDs: [],
    $SR: 'sr-1' as FrontXoVdi['$SR'],
    size: 10 * ONE_GB,
    $pool: 'pool-789' as FrontXoVdi['$pool'],
    type: 'VDI',
    usage: 5 * ONE_GB,
    tags: [],
    uuid: 'vdi-uuid-1',
    cbt_enabled: false,
    image_format: 'vhd',
    ...overrides,
  }
}
