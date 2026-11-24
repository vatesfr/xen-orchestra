import NewNetworkDrawer from '@/modules/network/components/drawer/NewNetworkDrawer.vue'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import { openSelect, pickSelectOption } from '@/test/select.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'network', 'pif')

const POOL = createPool()

const PIF = createPif({ id: 'pif-1' as FrontXoPif['id'], device: 'eth0', $host: POOL.master })

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
  xoCollectionsMock.pifs.value = [PIF]
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewNetworkDrawer, { poolId: POOL.id })
  await flushPromises()

  return wrapper
}

async function fillDrawer(wrapper: VueWrapper) {
  await openSelect(getInputWrapper(wrapper, t('interface')))
  await pickSelectOption(wrapper, PIF.device)
  await getInputWrapper(wrapper, t('name')).get('input').setValue('Network')
  await getInputWrapper(wrapper, t('vlan')).get('input').setValue('10')
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm an incomplete network', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the network to create on the pool of the page', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ poolId: POOL.id, name: 'Network', pif: PIF.id, vlan: 10 }]])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
