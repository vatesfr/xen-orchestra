import PoolConnectionSuccess from '@/modules/pool/components/connection/PoolConnectionSuccess.vue'
import type {
  FrontXoServer,
  useXoServerCollection,
} from '@/modules/server/remote-resources/use-xo-server-collection.ts'
import { createServer } from '@/test/create-server.ts'
import { findTitle } from '@/test/find-titles.ts'
import { getButton } from '@/test/get-button.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import UiAlert from '@core/components/ui/alert/UiAlert.vue'
import UiLink from '@core/components/ui/link/UiLink.vue'
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
  expect(findTitle(mountSuccess())).toBe(t('connected-to-ip', { ip: '10.0.0.1' }))
})

it('tells the connection succeeded', () => {
  const alert = mountSuccess().getComponent(UiAlert)

  expect(alert.props('accent')).toBe('success')
  expect(alert.text()).toBe(t('pool-connection-success'))
})

it('links to the dashboard of the connected pool', () => {
  const link = mountSuccess().getComponent(UiLink)

  expect(link.text()).toBe(t('action:visit-pool-dashboard'))
  expect(link.props('to')).toEqual({ name: '/pool/[id]/dashboard', params: { id: SERVER.poolId } })
})

it('offers to connect another pool', async () => {
  const wrapper = mountSuccess()

  await getButton(wrapper, t('action:connect-another-pool')).trigger('click')

  expect(wrapper.emitted('connectAnotherPool')).toHaveLength(1)
})

it('has neither title nor link while the server is unknown', () => {
  servers.value = []

  const wrapper = mountSuccess()

  expect(findTitle(wrapper)).toBeUndefined()
  expect(wrapper.findComponent(UiLink).exists()).toBe(false)
})

it('has no link while the pool of the server is unknown', () => {
  servers.value = [{ ...SERVER, poolId: undefined }]

  expect(mountSuccess().findComponent(UiLink).exists()).toBe(false)
})
