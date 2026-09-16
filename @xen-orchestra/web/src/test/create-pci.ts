import type { FrontXoPci } from '@/modules/pci/remote-resources/use-xo-pci-collection.ts'

/**
 * Builds a fully-populated `FrontXoPci` for use in tests. Pass `overrides` to
 * tweak only the fields relevant to the case under test.
 */
export function createPci(overrides: Partial<FrontXoPci> = {}): FrontXoPci {
  return {
    id: 'pci-123' as FrontXoPci['id'],
    device_name: 'GA102GL [A40]',
    type: 'PCI',
    ...overrides,
  }
}
