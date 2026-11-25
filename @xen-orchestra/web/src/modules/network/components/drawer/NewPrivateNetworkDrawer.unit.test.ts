import NewPrivateNetworkDrawer from '@/modules/network/components/drawer/NewPrivateNetworkDrawer.vue'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createHost } from '@/test/create-host.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { findTableColumnCells } from '@/test/find-table-cells.ts'
import { createGlobalTestConfig } from '@/test/global-test-config.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { chooseSelectOption } from '@core-test/select.ts'
import { TUNNEL_PROTOCOL } from '@vates/types'
import { flushPromises, mount, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'network', 'pif')

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

async function fillDrawer(wrapper: VueWrapper) {
  await getField(wrapper, t('name')).get('input').setValue('Private network')
  await chooseSelectOption(wrapper, 'GRE', { container: getField(wrapper, t('encapsulation')) })
  await chooseSelectOption(wrapper, PIF.device, {
    container: findTableColumnCells(wrapper, t('pif'))[0],
    detailed: true,
  })
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
