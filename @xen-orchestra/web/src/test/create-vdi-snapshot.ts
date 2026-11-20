import type { FrontXoVdiSnapshot } from '@/modules/vdi/remote-resources/use-xo-vdi-snapshot-collection.ts'

export function createVdiSnapshot(overrides: Partial<FrontXoVdiSnapshot> = {}): FrontXoVdiSnapshot {
  return {
    id: 'vdi-snapshot-1' as FrontXoVdiSnapshot['id'],
    name_label: 'Test VDI snapshot',
    name_description: 'A test virtual disk image snapshot',
    $VBDs: [],
    $SR: 'sr-1' as FrontXoVdiSnapshot['$SR'],
    size: 10737418240,
    $pool: 'pool-789' as FrontXoVdiSnapshot['$pool'],
    type: 'VDI-snapshot',
    usage: 5368709120,
    tags: [],
    uuid: 'vdi-snapshot-uuid-1',
    snapshot_time: 1700000000,
    $snapshot_of: undefined,
    image_format: 'vhd',
    cbt_enabled: false,
    ...overrides,
  }
}
