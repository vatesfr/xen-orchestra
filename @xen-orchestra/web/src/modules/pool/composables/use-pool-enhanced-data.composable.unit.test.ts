import { usePoolEnhancedData } from '@/modules/pool/composables/use-pool-enhanced-data.composable.ts'
import { createEnhancedDataHelpers } from '@/test/create-enhanced-data-helpers.ts'
import { createHost } from '@/test/create-host.ts'
import { createServer } from '@/test/create-server.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mockModule } from '@/test/spy-on-module.ts'
import { objectIcon } from '@core/icons'
import { HOST_POWER_STATE } from '@vates/types'
import { ref } from 'vue'

mockModule(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

beforeEach(() => {
  xoCollectionsMock.reset()
})

const { mountEnhancedData, mountFirstFilterable, mountFirstDisplayData } = createEnhancedDataHelpers(
  usePoolEnhancedData,
  result => result.filterableServers,
  createServer
)

describe('filterableServers', () => {
  it('maps poolName from the server pool label', () => {
    const filterableServer = mountFirstFilterable([createServer({ poolNameLabel: 'Production Pool' })])

    expect(filterableServer.poolName).toBe('Production Pool')
  })

  it('sets masterHostIp from the server host address', () => {
    const filterableServer = mountFirstFilterable([createServer({ host: '10.0.0.42' })])

    expect(filterableServer.masterHostIp).toBe('10.0.0.42')
  })

  it('reports an unreachable pool status when the server has an error', () => {
    const filterableServer = mountFirstFilterable([
      createServer({ error: { code: 'ECONNREFUSED' }, status: 'connected' }),
    ])

    expect(filterableServer.poolStatus).toBe('unable-to-connect-to-the-pool')
  })

  it('uses the server status when there is no error', () => {
    const filterableServer = mountFirstFilterable([createServer({ error: undefined, status: 'disconnected' })])

    expect(filterableServer.poolStatus).toBe('disconnected')
  })

  it('resolves primaryHostName from the master host name label', () => {
    xoCollectionsMock.hosts.value = [createHost({ name_label: 'Primary Host' })]

    const filterableServer = mountFirstFilterable()

    expect(filterableServer.primaryHostName).toBe('Primary Host')
  })

  it('falls back to an empty primaryHostName when the master host is unknown', () => {
    const filterableServer = mountFirstFilterable()

    expect(filterableServer.primaryHostName).toBe('')
  })

  it('recomputes when the source servers change', () => {
    const servers = ref([createServer({ error: undefined, status: 'connected' })])
    const result = mountEnhancedData(servers)

    expect(result.filterableServers[0].poolStatus).toBe('connected')

    servers.value = [createServer({ error: { code: 'ECONNREFUSED' } })]

    expect(result.filterableServers[0].poolStatus).toBe('unable-to-connect-to-the-pool')
  })
})

describe('getDisplayData', () => {
  it('derives the host icons from the state of the master host', () => {
    xoCollectionsMock.hosts.value = [createHost({ power_state: HOST_POWER_STATE.RUNNING })]

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBe(objectIcon('host', 'running'))
    expect(displayData.primaryHostIcon).toBe(objectIcon('host', 'running'))
  })

  it('leaves the host icons undefined when the master host is unknown', () => {
    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBeUndefined()
    expect(displayData.primaryHostIcon).toBeUndefined()
    expect(displayData.primaryHostRightIcon).toBeUndefined()
  })

  it('maps the host icons to the halted state when the master host is halted', () => {
    xoCollectionsMock.hosts.value = [createHost({ power_state: HOST_POWER_STATE.HALTED })]

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBe(objectIcon('host', 'halted'))
  })

  it('maps the host icons to the disabled state when the master host is running but not enabled', () => {
    xoCollectionsMock.hosts.value = [createHost({ power_state: HOST_POWER_STATE.RUNNING, enabled: false })]

    const displayData = mountFirstDisplayData()

    expect(displayData.hostIcon).toBe(objectIcon('host', 'disabled'))
  })

  it('shows the primary-circle icon when the master host leads its pool', () => {
    xoCollectionsMock.hosts.value = [createHost()]
    xoCollectionsMock.seedMasterHost(createHost())

    const displayData = mountFirstDisplayData()

    expect(displayData.primaryHostRightIcon).toBe('status:primary-circle')
  })

  it('omits the primary-circle icon when the master host does not lead its pool', () => {
    xoCollectionsMock.hosts.value = [createHost()]

    const displayData = mountFirstDisplayData()

    expect(displayData.primaryHostRightIcon).toBeUndefined()
  })

  it('sets the pool icon when the pool has a name', () => {
    const displayData = mountFirstDisplayData()

    expect(displayData.poolIcon).toBe('object:pool')
  })

  it('omits the pool icon when the pool has no name', () => {
    const displayData = mountFirstDisplayData([createServer({ poolNameLabel: undefined, poolId: undefined })])

    expect(displayData.poolIcon).toBeUndefined()
  })
})
