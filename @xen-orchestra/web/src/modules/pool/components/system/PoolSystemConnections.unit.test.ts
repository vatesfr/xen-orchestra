import PoolSystemConnections from '@/modules/pool/components/system/PoolSystemConnections.vue'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type {
  FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { createServer } from '@/test/create-server.ts'
import { findLabelledValues } from '@/test/find-labelled-values.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { ref } from 'vue'

const { useXoServerCollectionMock } = vi.hoisted(() => ({
  useXoServerCollectionMock: vi.fn(),
}))

vi.mock(import('@/modules/server/remote-resources/use-xo-server-collection.ts'), () => ({
  useXoServerCollection: useXoServerCollectionMock as unknown as typeof useXoServerCollection,
}))

const POOL_ID = 'pool-1' as FrontXoPool['id']

beforeEach(() => {
  useXoServerCollectionMock.mockReset()
  useXoServerCollectionMock.mockReturnValue({ serverByPool: ref(new Map()), areServersReady: ref(true) })
})

function givenServers(servers: FrontXoServer[], areServersReady = true) {
  useXoServerCollectionMock.mockReturnValue({
    serverByPool: ref(new Map([[POOL_ID, servers]])),
    areServersReady: ref(areServersReady),
  })
}

function mountConnections() {
  return mount(PoolSystemConnections, {
    props: { pool: createPool({ id: POOL_ID }) },
    global: createGlobalTestConfig(),
  })
}

it('renders the card title', () => {
  const wrapper = mountConnections()

  expect(wrapper.get('.ui-title').text()).toBe(t('connections'))
})

it('shows a busy state instead of the rows while the servers are loading', () => {
  givenServers([createServer()], false)

  const wrapper = mountConnections()

  expect(wrapper.find('.vts-state-hero').exists()).toBe(true)
  expect(findLabelledValues(wrapper)).toEqual({})
})

it('shows the connection settings of the server of the pool', () => {
  givenServers([
    createServer({
      host: '10.0.0.1',
      httpProxy: 'http://proxy.example.com',
      username: 'root',
      readOnly: false,
      allowUnauthorized: false,
    }),
  ])

  expect(findLabelledValues(mountConnections())).toEqual({
    [t('ip-address')]: '10.0.0.1',
    [t('proxy-url')]: 'http://proxy.example.com',
    [t('username')]: 'root',
    [t('read-only')]: t('disabled'),
    [t('self-signed-certificates')]: t('disabled'),
  })
})

it('shows the read-only and self-signed certificate settings as enabled when the server allows them', () => {
  givenServers([createServer({ readOnly: true, allowUnauthorized: true })])

  expect(findLabelledValues(mountConnections())).toMatchObject({
    [t('read-only')]: t('enabled'),
    [t('self-signed-certificates')]: t('enabled'),
  })
})

it('reads the first server of the pool when several are connected to it', () => {
  givenServers([createServer({ host: '10.0.0.1' }), createServer({ host: '10.0.0.2' })])

  expect(findLabelledValues(mountConnections())).toMatchObject({ [t('ip-address')]: '10.0.0.1' })
})

it('leaves the settings empty and disabled when no server is connected to the pool', () => {
  givenServers([])

  expect(findLabelledValues(mountConnections())).toEqual({
    [t('ip-address')]: '',
    [t('proxy-url')]: '',
    [t('username')]: '',
    [t('read-only')]: t('disabled'),
    [t('self-signed-certificates')]: t('disabled'),
  })
})
