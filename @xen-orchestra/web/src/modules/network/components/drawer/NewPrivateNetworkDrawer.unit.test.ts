import NewPrivateNetworkDrawer from '@/modules/network/components/drawer/NewPrivateNetworkDrawer.vue'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { TUNNEL_PROTOCOL } from '@vates/types'
import { type DOMWrapper, flushPromises, mount, type VueWrapper } from '@vue/test-utils'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const POOL = createPool()

const PIF = createPif({ id: 'pif-1' as FrontXoPif['id'], device: 'eth0', $host: POOL.master })

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
  xoCollectionsMock.hosts.value = [createHost()]
  xoCollectionsMock.pifs.value = [PIF]
})

async function mountDrawer() {
  const wrapper = mount(NewPrivateNetworkDrawer, {
    props: { poolId: POOL.id },
    global: createGlobalTestConfig(),
    attachTo: document.body,
  })
  await flushPromises()

  return wrapper
}

function getField(wrapper: VueWrapper, label: string) {
  const field = wrapper.findAll('.vts-input-wrapper').find(field => field.get('.ui-label').text().includes(label))

  if (field === undefined) {
    throw new Error(`No field labelled "${label}"`)
  }

  return field
}

// An option may show details after its label, like the device of a PIF
async function select(wrapper: VueWrapper, selectContainer: DOMWrapper<Element>, optionLabel: string) {
  await selectContainer.get('.vts-select .ui-input').trigger('click')
  await flushPromises()

  const option = wrapper.findAll('.ui-dropdown').find(option => option.text().startsWith(optionLabel))

  if (option === undefined) {
    throw new Error(`No option "${optionLabel}"`)
  }

  await option.trigger('click')
  await flushPromises()
}

async function fillDrawer(wrapper: VueWrapper) {
  await getField(wrapper, t('name')).get('input').setValue('Private network')
  await select(wrapper, getField(wrapper, t('encapsulation')), 'GRE')
  await select(wrapper, findTableColumnCells(wrapper, t('pif'))[0], PIF.device)
}

describe('confirm', () => {
  it('does not confirm an incomplete private network', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the private network to create on the pool of the page', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [
        {
          poolIds: [POOL.id],
          pifIds: [PIF.id],
          name: 'Private network',
          description: '',
          encapsulation: TUNNEL_PROTOCOL.GRE,
          encrypted: false,
        },
      ],
    ])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
