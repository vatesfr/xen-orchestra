import NewBondedNetworkDrawer from '@/modules/network/components/drawer/NewBondedNetworkDrawer.vue'
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
import { BOND_MODE } from '@vates/types'
import { flushPromises, type VueWrapper } from '@vue/test-utils'

mockXoCollections('pool', 'host', 'network', 'pif')

const POOL = createPool()

const PIFS = [
  createPif({ id: 'pif-1' as FrontXoPif['id'], device: 'eth0', $host: POOL.master }),
  createPif({ id: 'pif-2' as FrontXoPif['id'], device: 'eth1', $host: POOL.master }),
]

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL]
  xoCollectionsMock.pifs.value = PIFS
})

async function mountDrawer() {
  const wrapper = mountWithProps(NewBondedNetworkDrawer, { poolId: POOL.id })
  await flushPromises()

  return wrapper
}

async function fillDrawer(wrapper: VueWrapper) {
  await openSelect(getInputWrapper(wrapper, t('interfaces')))
  await pickSelectOption(wrapper, 'eth0')
  await pickSelectOption(wrapper, 'eth1')
  await openSelect(getInputWrapper(wrapper, t('bond-mode')))
  await pickSelectOption(wrapper, BOND_MODE.ACTIVE_BACKUP)
  await getInputWrapper(wrapper, t('name')).get('input').setValue('Bonded network')
}

it('tells which fields are required', async () => {
  expect((await mountDrawer()).findComponent(VtsRequiredHint).exists()).toBe(true)
})

describe('confirm', () => {
  it('does not confirm an incomplete bonded network', async () => {
    const wrapper = await mountDrawer()

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toBeUndefined()
  })

  it('confirms with the bonded network to create on the pool of the page', async () => {
    const wrapper = await mountDrawer()
    await fillDrawer(wrapper)

    await submitDrawer(wrapper)

    expect(wrapper.emitted('confirm')).toEqual([
      [
        {
          poolId: POOL.id,
          name: 'Bonded network',
          pifIds: ['pif-1', 'pif-2'],
          bondMode: BOND_MODE.ACTIVE_BACKUP,
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
