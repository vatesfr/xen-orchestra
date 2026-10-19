import V2vRememberedConnectionItem from '@/modules/v2v/components/source/V2vRememberedConnectionItem.vue'
import V2vRememberedConnectionList from '@/modules/v2v/components/source/V2vRememberedConnectionList.vue'
import type { V2vRememberedConnection } from '@/modules/v2v/types/v2v-remembered-connection.type.ts'
import { createV2vRememberedConnection } from '@/test/create-v2v-connection.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { vmCollectionMock } from '@/test/mock-xo-vm-collection.ts'
import { mount } from '@vue/test-utils'

vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-collection.ts'),
  () => import('@/test/mock-xo-vm-collection.ts')
)

beforeEach(() => {
  vmCollectionMock.reset()
})

function mountList(connections: V2vRememberedConnection[], disabled = false) {
  return mount(V2vRememberedConnectionList, {
    props: { connections, disabled },
    global: createGlobalTestConfig(),
  })
}

const CONNECTIONS = [createV2vRememberedConnection({ host: 'a.lab' }), createV2vRememberedConnection({ host: 'b.lab' })]

it('shows one item per connection, in order', () => {
  const items = mountList(CONNECTIONS).findAllComponents(V2vRememberedConnectionItem)

  expect(items.map(item => item.props('connection'))).toEqual(CONNECTIONS)
})

it('passes the disabled state to every item', () => {
  const items = mountList(CONNECTIONS, true).findAllComponents(V2vRememberedConnectionItem)

  expect(items.map(item => item.props('disabled'))).toEqual([true, true])
})

it('shows an empty state without connection', () => {
  const wrapper = mountList([])

  expect(wrapper.findAllComponents(V2vRememberedConnectionItem)).toHaveLength(0)
  expect(wrapper.text()).toContain(t('no-remembered-connection'))
})

it.each(['connect', 'edit', 'forget', 'forgetPassword'] as const)('forwards %s with the connection', async event => {
  const wrapper = mountList(CONNECTIONS)

  wrapper.findAllComponents(V2vRememberedConnectionItem)[1].vm.$emit(event, CONNECTIONS[1])

  expect(wrapper.emitted(event)).toEqual([[CONNECTIONS[1]]])
})
