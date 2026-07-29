import {
  getHostCoreSocketInfo,
  getHostInfo,
  getHostManufacturerInfo,
  getHostRamProvisioning,
  isHostOperationPending,
} from '@/modules/host/utils/xo-host.util.ts'
import { createHost } from '@/test/create-host.ts'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { HOST_ALLOWED_OPERATIONS } from '@vates/types'

describe('isHostOperationPending', () => {
  test('matches a single operation', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT } })

    expect(isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.REBOOT)).toBe(true)
  })

  test('matches when given an array of operations', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.SHUTDOWN } })

    expect(isHostOperationPending(host, [HOST_ALLOWED_OPERATIONS.REBOOT, HOST_ALLOWED_OPERATIONS.SHUTDOWN])).toBe(true)
  })

  test('returns false when none of the current operations match', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.ENABLE } })

    expect(isHostOperationPending(host, [HOST_ALLOWED_OPERATIONS.REBOOT, HOST_ALLOWED_OPERATIONS.SHUTDOWN])).toBe(false)
  })

  test('returns false when there are no current operations', () => {
    const host = createHost({ current_operations: {} })

    expect(isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.REBOOT)).toBe(false)
  })
})

describe('getHostInfo', () => {
  test('returns the host name label and its dashboard link when a host is provided', () => {
    const host = createHost({ name_label: 'Primary Host' })

    expect(getHostInfo(host)).toEqual({ label: 'Primary Host', to: `/host/${host.id}/dashboard` })
  })

  test('returns an empty label when no host is provided', () => {
    expect(getHostInfo(undefined)).toEqual({ label: '' })
  })
})

describe('getHostCoreSocketInfo', () => {
  test('formats the core count with its socket count', () => {
    const host = createHost({ cpus: { cores: 8, sockets: 2 } })

    expect(getHostCoreSocketInfo(host)).toBe('8 (2)')
  })

  test('falls back to zero for missing core and socket counts', () => {
    const host = createHost({ cpus: {} })

    expect(getHostCoreSocketInfo(host)).toBe('0 (0)')
  })
})

describe('getHostManufacturerInfo', () => {
  test('combines the manufacturer with the product name in parentheses', () => {
    const host = createHost({
      bios_strings: { 'system-manufacturer': 'Dell Inc.', 'system-product-name': 'PowerEdge R740' },
    })

    expect(getHostManufacturerInfo(host)).toBe('Dell Inc. (PowerEdge R740)')
  })

  test('returns only the manufacturer when there is no product name', () => {
    const host = createHost({ bios_strings: { 'system-manufacturer': 'Dell Inc.' } })

    expect(getHostManufacturerInfo(host)).toBe('Dell Inc.')
  })

  test('returns an empty string when the bios strings are missing', () => {
    const host = createHost({ bios_strings: {} })

    expect(getHostManufacturerInfo(host)).toBe('')
  })
})

describe('getHostRamProvisioning', () => {
  test('formats total, used and free memory sizes', () => {
    const size = 8 * 1024 ** 3
    const usage = 3 * 1024 ** 3
    const host = createHost({ memory: { size, usage } })

    expect(getHostRamProvisioning(host)).toEqual({
      total: formatSizeRaw(size, 0),
      used: formatSizeRaw(usage, 0),
      free: formatSizeRaw(size - usage, 0),
    })
  })

  test('reports zero free memory when the host is fully used', () => {
    const size = 4 * 1024 ** 3
    const host = createHost({ memory: { size, usage: size } })

    expect(getHostRamProvisioning(host).free).toEqual(formatSizeRaw(0, 0))
  })
})
