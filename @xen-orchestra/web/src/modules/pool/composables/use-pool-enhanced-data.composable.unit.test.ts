import type { useXoHostCollection } from '@/modules/host/remote-resources/use-xo-host-collection.ts'
import { usePoolEnhancedData } from '@/modules/pool/composables/use-pool-enhanced-data.composable.ts'
import type { FrontXoServer } from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createServer } from '@/test/create-server.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { objectIcon } from '@core/icons/index.ts'
import { HOST_POWER_STATE } from '@vates/types'
import { ref, type MaybeRefOrGetter } from 'vue'

const { getHostById, isMasterHost } = vi.hoisted(() => ({
  getHostById: vi.fn(),
  isMasterHost: vi.fn(),
}))

vi.mock(import('@/modules/host/remote-resources/use-xo-host-collection.ts'), () => ({
  useXoHostCollection: (() => ({ getHostById, isMasterHost })) as unknown as typeof useXoHostCollection,
}))

beforeEach(() => {
  getHostById.mockReset()
  isMasterHost.mockReset()
})

function mountEnhancedData(servers: MaybeRefOrGetter<FrontXoServer[]> = [createServer()]) {
  return mountComposable(() => usePoolEnhancedData(servers)).result
}

function mountFirstDisplayData(servers: FrontXoServer[] = [createServer()]) {
  const result = mountEnhancedData(servers)

  return result.getDisplayData(result.filterableServers.value[0])
}

describe('filterableServers', () => {
  test('maps poolName from the server pool label', () => {
    const result = mountEnhancedData([createServer({ poolNameLabel: 'Production Pool' })])

    expect(result.filterableServers.value[0].poolName).toBe('Production Pool')
  })

  test('sets masterHostIp from the server host address', () => {
    const result = mountEnhancedData([createServer({ host: '10.0.0.42' })])

    expect(result.filterableServers.value[0].masterHostIp).toBe('10.0.0.42')
  })

  test('reports an unreachable pool status when the server has an error', () => {
    const result = mountEnhancedData([createServer({ error: { code: 'ECONNREFUSED' }, status: 'connected' })])

    expect(result.filterableServers.value[0].poolStatus).toBe('unable-to-connect-to-the-pool')
  })

  test('uses the server status when there is no error', () => {
    const result = mountEnhancedData([createServer({ error: undefined, status: 'disconnected' })])

    expect(result.filterableServers.value[0].poolStatus).toBe('disconnected')
  })

  test('resolves primaryHostName from the master host name label', () => {
    getHostById.mockReturnValue(createHost({ name_label: 'Primary Host' }))

    const result = mountEnhancedData()

    expect(result.filterableServers.value[0].primaryHostName).toBe('Primary Host')
  })

  test('falls back to an empty primaryHostName when the master host is unknown', () => {
    getHostById.mockReturnValue(undefined)

    const result = mountEnhancedData()

    expect(result.filterableServers.value[0].primaryHostName).toBe('')
  })

  test('recomputes when the source servers change', () => {
    const servers = ref([createServer({ error: undefined, status: 'connected' })])
    const result = mountEnhancedData(servers)

    expect(result.filterableServers.value[0].poolStatus).toBe('connected')

    servers.value = [createServer({ error: { code: 'ECONNREFUSED' } })]

    expect(result.filterableServers.value[0].poolStatus).toBe('unable-to-connect-to-the-pool')
  })
})

describe('getDisplayData', () => {
  test('derives the host icons from the master host power state', () => {
    getHostById.mockReturnValue(createHost({ power_state: HOST_POWER_STATE.RUNNING }))
    isMasterHost.mockReturnValue(false)

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBe(objectIcon('host', 'running'))
    expect(displayData.primaryHostIcon).toBe(objectIcon('host', 'running'))
  })

  test('leaves the host icons undefined when the master host is unknown', () => {
    getHostById.mockReturnValue(undefined)

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBeUndefined()
    expect(displayData.primaryHostIcon).toBeUndefined()
    expect(displayData.primaryHostRightIcon).toBeUndefined()
  })

  test('maps the host icons to the halted state when the master host is halted', () => {
    getHostById.mockReturnValue(createHost({ power_state: HOST_POWER_STATE.HALTED }))
    isMasterHost.mockReturnValue(false)

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBe('object:host:halted')
  })

  test('shows the primary-circle icon when the master host leads its pool', () => {
    getHostById.mockReturnValue(createHost())
    isMasterHost.mockReturnValue(true)

    const displayData = mountFirstDisplayData()

    expect(displayData.primaryHostRightIcon).toBe('status:primary-circle')
  })

  test('omits the primary-circle icon when the master host does not lead its pool', () => {
    getHostById.mockReturnValue(createHost())
    isMasterHost.mockReturnValue(false)

    const displayData = mountFirstDisplayData()

    expect(displayData.primaryHostRightIcon).toBeUndefined()
  })

  test('always sets the pool icon', () => {
    getHostById.mockReturnValue(undefined)

    const displayData = mountFirstDisplayData()

    expect(displayData.poolIcon).toBe('object:pool')
  })
})
