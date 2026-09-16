import type { FrontXoPgpu } from '@/modules/pgpu/remote-resources/use-xo-pgpu-collection.ts'

/**
 * Builds a fully-populated `FrontXoPgpu` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPgpu(overrides: Partial<FrontXoPgpu> = {}): FrontXoPgpu {
  return {
    id: 'pgpu-123' as FrontXoPgpu['id'],
    pci: 'pci-123' as FrontXoPgpu['pci'],
    type: 'PGPU',
    ...overrides,
  }
}
