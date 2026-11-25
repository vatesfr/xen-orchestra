import {
  type PrivateNetworkInterface,
  usePrivateNetworkInterface,
} from '@/modules/network/form/new-private/use-private-network-interface.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountWithSetup } from '@/test/mount-with-setup.ts'
import { renderSelect } from '@core-test/mount-with-select.ts'
import { chooseSelectOption, findSelectOptionLabels, openSelect } from '@core-test/select.ts'
import { h, nextTick, reactive, ref } from 'vue'

mockXoCollections('pool', 'pif', 'network')

const POOL = createPool()

const OTHER_POOL = createPool({
  id: OTHER_POOL_ID,
  name_label: 'Other pool',
  master: 'host-2' as FrontXoPool['master'],
})

const VLAN_PIF = createPif({
  id: 'pif-vlan' as FrontXoPif['id'],
  device: 'eth0.10',
  $host: POOL.master,
  vlan: 10,
  physical: false,
})

beforeEach(() => {
  xoCollectionsMock.reset()
  xoCollectionsMock.pools.value = [POOL, OTHER_POOL]
  xoCollectionsMock.pifs.value = [VLAN_PIF]
})

function createInterface(pool?: FrontXoPool['id']): PrivateNetworkInterface {
  return reactive({ key: 'interface-1', pool, pif: undefined })
}

// The pool and the PIF of the interface are only chosen through their select, rendered here
function mountInterface(networkInterface: PrivateNetworkInterface, excludedPoolIds = ref<FrontXoPool['id'][]>([])) {
  return mountWithSetup(() => {
    const { poolSelectId, pifSelectId } = usePrivateNetworkInterface(networkInterface, excludedPoolIds)

    return () =>
      h('div', [
        h('div', { class: 'pool' }, [renderSelect(poolSelectId)]),
        h('div', { class: 'pif' }, [renderSelect(pifSelectId)]),
      ])
  })
}

describe('poolSelectId', () => {
  it('offers the pools the other interfaces have not taken', async () => {
    const wrapper = mountInterface(createInterface(), ref([POOL.id]))

    await openSelect(wrapper.get('.pool'))

    expect(findSelectOptionLabels(wrapper)).toEqual([OTHER_POOL.name_label])
  })

  it('sets the pool of the interface', async () => {
    const networkInterface = createInterface()
    const wrapper = mountInterface(networkInterface)

    await chooseSelectOption(wrapper, OTHER_POOL.name_label, { container: wrapper.get('.pool') })

    expect(networkInterface.pool).toBe(OTHER_POOL_ID)
  })

  it('forgets the pool of the interface once another interface takes it', async () => {
    const networkInterface = createInterface(POOL.id)
    const excludedPoolIds = ref<FrontXoPool['id'][]>([])
    mountInterface(networkInterface, excludedPoolIds)

    excludedPoolIds.value = [POOL.id]
    await nextTick()

    expect(networkInterface.pool).toBeUndefined()
  })

  it('keeps the pool of the interface when another interface takes another pool', async () => {
    const networkInterface = createInterface(POOL.id)
    const excludedPoolIds = ref<FrontXoPool['id'][]>([])
    mountInterface(networkInterface, excludedPoolIds)

    excludedPoolIds.value = [OTHER_POOL_ID]
    await nextTick()

    expect(networkInterface.pool).toBe(POOL.id)
  })
})

describe('pifSelectId', () => {
  it('offers the PIFs of the pool of the interface that can carry a private network', async () => {
    const wrapper = mountInterface(createInterface(POOL.id))

    await openSelect(wrapper.get('.pif'))

    expect(findAllGenericComponents(wrapper, 'VtsOption').map(option => option.props('option').source.id)).toEqual([
      VLAN_PIF.id,
    ])
  })

  it('sets the PIF of the interface by its id', async () => {
    const networkInterface = createInterface(POOL.id)
    const wrapper = mountInterface(networkInterface)

    await chooseSelectOption(wrapper, VLAN_PIF.device, { container: wrapper.get('.pif') })

    expect(networkInterface.pif).toBe(VLAN_PIF.id)
  })
})
