import type { FrontXoVbd } from '@/modules/vbd/remote-resources/use-xo-vbd-collection.ts'

/**
 * Builds a fully-populated `FrontXoVbd` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createVbd(overrides: Partial<FrontXoVbd> = {}): FrontXoVbd {
  return {
    id: 'vbd-1' as FrontXoVbd['id'],
    VDI: 'vdi-1' as FrontXoVbd['VDI'],
    VM: 'vm-123' as FrontXoVbd['VM'],
    is_cd_drive: false,
    position: '0',
    type: 'VBD',
    attached: true,
    device: 'xvda',
    read_only: false,
    bootable: true,
    ...overrides,
  }
}
