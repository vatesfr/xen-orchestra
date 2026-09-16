import {
  getHostCoreSocketInfo,
  getHostIcon,
  getHostManufacturerInfo,
  getHostRamProvisioning,
  getHostState,
  isHostOperationPending,
} from '@/modules/host/utils/xo-host.util.ts'
import { createHost } from '@/test/create-host.ts'
import { objectIcon } from '@core/icons'
import { formatSizeRaw } from '@core/utils/size.util.ts'
import { HOST_ALLOWED_OPERATIONS, HOST_POWER_STATE } from '@vates/types'

describe('isHostOperationPending', () => {
  it('matches a single operation', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.REBOOT } })

    expect(isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.REBOOT)).toBe(true)
  })

  it('matches when given an array of operations', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.SHUTDOWN } })

    expect(isHostOperationPending(host, [HOST_ALLOWED_OPERATIONS.REBOOT, HOST_ALLOWED_OPERATIONS.SHUTDOWN])).toBe(true)
  })

  it('returns false when none of the current operations match', () => {
    const host = createHost({ current_operations: { 'task-1': HOST_ALLOWED_OPERATIONS.ENABLE } })

    expect(isHostOperationPending(host, [HOST_ALLOWED_OPERATIONS.REBOOT, HOST_ALLOWED_OPERATIONS.SHUTDOWN])).toBe(false)
  })

  it('returns false when there are no current operations', () => {
    const host = createHost({ current_operations: {} })

    expect(isHostOperationPending(host, HOST_ALLOWED_OPERATIONS.REBOOT)).toBe(false)
  })
})

describe('getHostState', () => {
  it('reports a running host as running', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true })

    expect(getHostState(host)).toBe('running')
  })

  it('reports a running host that is not enabled as disabled', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false })

    expect(getHostState(host)).toBe('disabled')
  })

  it('reports a halted host as halted even when it is not enabled', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.HALTED, enabled: false })

    expect(getHostState(host)).toBe('halted')
  })

  it('reports an unknown power state as unknown', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.UNKNOWN })

    expect(getHostState(host)).toBe('unknown')
  })

  it('reports an unknown power state as unknown even when the host is not enabled', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.UNKNOWN, enabled: false })

    expect(getHostState(host)).toBe('unknown')
  })

  it('reports a missing host as unknown', () => {
    expect(getHostState(undefined)).toBe('unknown')
  })
})

describe('getHostCoreSocketInfo', () => {
  it('formats the core count with its socket count', () => {
    const host = createHost({ cpus: { cores: 8, sockets: 2 } })

    expect(getHostCoreSocketInfo(host)).toBe('8 (2)')
  })

  it('falls back to zero for missing core and socket counts', () => {
    const host = createHost({ cpus: {} })

    expect(getHostCoreSocketInfo(host)).toBe('0 (0)')
  })
})

describe('getHostManufacturerInfo', () => {
  it('combines the manufacturer with the product name in parentheses', () => {
    const host = createHost({
      bios_strings: { 'system-manufacturer': 'Dell Inc.', 'system-product-name': 'PowerEdge R740' },
    })

    expect(getHostManufacturerInfo(host)).toBe('Dell Inc. (PowerEdge R740)')
  })

  it('returns only the manufacturer when there is no product name', () => {
    const host = createHost({ bios_strings: { 'system-manufacturer': 'Dell Inc.' } })

    expect(getHostManufacturerInfo(host)).toBe('Dell Inc.')
  })

  it('returns an empty string when the bios strings are missing', () => {
    const host = createHost({ bios_strings: {} })

    expect(getHostManufacturerInfo(host)).toBe('')
  })
})

describe('getHostRamProvisioning', () => {
  it('formats total, used and free memory sizes', () => {
    const size = 8 * 1024 ** 3
    const usage = 3 * 1024 ** 3
    const host = createHost({ memory: { size, usage } })

    expect(getHostRamProvisioning(host)).toEqual({
      total: formatSizeRaw(size, 0),
      used: formatSizeRaw(usage, 0),
      free: formatSizeRaw(size - usage, 0),
    })
  })

  it('reports zero free memory when the host is fully used', () => {
    const size = 4 * 1024 ** 3
    const host = createHost({ memory: { size, usage: size } })

    expect(getHostRamProvisioning(host).free).toEqual(formatSizeRaw(0, 0))
  })
})

describe('getHostIcon', () => {
  it('picks the host disabled icon', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false })

    expect(getHostIcon(host)).toBe(objectIcon('host', 'disabled'))
  })

  it('picks the host running icon', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: true })

    expect(getHostIcon(host)).toBe(objectIcon('host', 'running'))
  })

  it('picks the host halted icon', () => {
    const host = createHost({ power_state: HOST_POWER_STATE.HALTED, enabled: false })

    expect(getHostIcon(host)).toBe(objectIcon('host', 'halted'))
  })

  it('falls back to the unknown host icon when no host is provided', () => {
    expect(getHostIcon(undefined)).toBe(objectIcon('host', 'unknown'))
  })
})
