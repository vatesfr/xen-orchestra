import PoolConnectionSuccess from '@/modules/pool/components/connection/PoolConnectionSuccess.vue'
import type {
  FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createServer } from '@/test/create-server.ts'
import { getButton } from '@/test/get-button.ts'
import { getSuccessState } from '@/test/get-success-state.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { mount } from '@vue/test-utils'
import { computed, ref, toValue, type MaybeRefOrGetter } from 'vue'

const servers = ref<FrontXoServer[]>([])

vi.mock(import('@/modules/server/remote-resources/use-xo-server-collection.ts'), () => ({
  useXoServerCollection: (() => ({
    useGetServerById: (id: MaybeRefOrGetter<FrontXoServer['id']>) =>
      computed(() => servers.value.find(server => server.id === toValue(id))),
  })) as unknown as typeof useXoServerCollection,
}))

const SERVER = createServer({ host: '10.0.0.1' })

function mountSuccess() {
  return mount(PoolConnectionSuccess, { props: { serverId: SERVER.id }, global: createGlobalTestConfig() })
}

beforeEach(() => {
  servers.value = [SERVER]
})

it('tells the IP address the pool is connected to', () => {
  expect(getSuccessState(mountSuccess()).title).toBe(t('connected-to-ip', { ip: '10.0.0.1' }))
})

it('tells the connection succeeded', () => {
  expect(getSuccessState(mountSuccess()).message).toBe(t('pool-connection-success'))
})

it('links to the dashboard of the connected pool', () => {
  expect(getSuccessState(mountSuccess()).link).toEqual({
    label: t('action:visit-pool-dashboard'),
    to: { name: '/pool/[id]/dashboard', params: { id: SERVER.poolId } },
  })
})

it('offers to connect another pool', async () => {
  const wrapper = mountSuccess()

  await getButton(wrapper, t('action:connect-another-pool')).trigger('click')

  expect(wrapper.emitted('connectAnotherPool')).toHaveLength(1)
})

it('has neither title nor link while the server is unknown', () => {
  servers.value = []

  expect(getSuccessState(mountSuccess())).toMatchObject({ title: undefined, link: undefined })
})

it('has no link while the pool of the server is unknown', () => {
  servers.value = [{ ...SERVER, poolId: undefined }]

  expect(getSuccessState(mountSuccess()).link).toBeUndefined()
})
