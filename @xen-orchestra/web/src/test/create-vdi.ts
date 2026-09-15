import type { FrontXoVdi } from '@/modules/vdi/remote-resources/use-xo-vdi-collection.ts'

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
    size: 10737418240,
    $pool: 'pool-789' as FrontXoVdi['$pool'],
    type: 'VDI',
    usage: 5368709120,
    tags: [],
    uuid: 'vdi-uuid-1',
    cbt_enabled: false,
    image_format: 'vhd',
    ...overrides,
  }
}
