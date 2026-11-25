import NewInternalNetworkDrawer from '@/modules/network/components/drawer/NewInternalNetworkDrawer.vue'
import { createPool } from '@/test/create-pool.ts'
import { cancelDrawer, submitDrawer } from '@/test/drawer.ts'
import { getInputWrapper } from '@/test/find-input-labels.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountWithProps } from '@/test/mount-with-props.ts'
import VtsRequiredHint from '@core/components/required-hint/VtsRequiredHint.vue'
import { flushPromises } from '@vue/test-utils'

mockXoCollections('pool')

const POOL = createPool()

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewInternalNetworkDrawer, { poolId: POOL.id })
  await flushPromises()

  return wrapper
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm an internal network without a name', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the internal network to create on the pool of the page', async () => {
    const wrapper = await mountDrawer()
    await getInputWrapper(wrapper, t('name')).get('input').setValue('Internal network')

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([[{ poolId: POOL.id, name: 'Internal network' }]])
  })
})

it('cancels from the cancel button', async () => {
  const wrapper = await mountDrawer()

  await cancelDrawer(wrapper)

  expect(wrapper.emitted('cancel')).toHaveLength(1)
})
