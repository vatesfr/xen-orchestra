import { useNetworkPifSelect } from '@/modules/network/form/use-network-pif-select.ts'
import { NETWORK_TYPE } from '@/modules/network/utils/xo-network.util.ts'
import type { FrontXoPif } from '@/modules/pif/remote-resources/use-xo-pif-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createPif } from '@/test/create-pif.ts'
import { createPool, OTHER_POOL_ID } from '@/test/create-pool.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { t } from '@/test/i18n.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { findSelectOptionLabels, openSelect } from '@/test/select.ts'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { IP_CONFIGURATION_MODE } from '@vates/types'
import { nextTick, type Ref, ref, h } from 'vue'

vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const POOL = createPool()

const OTHER_POOL = createPool({ id: OTHER_POOL_ID, master: 'host-2' as FrontXoPool['master'] })

type PifSelectOptions = Parameters<typeof useNetworkPifSelect>[2]

beforeEach(() => {
  xoCollectionsMock.reset()
})

function createMasterPif(id: string, overrides: Partial<FrontXoPif> = {}) {
  return createPif({ id: id as FrontXoPif['id'], device: id, $host: POOL.master, ...overrides })
}

function mountPifSelect(
  options: Partial<PifSelectOptions> = {},
  { pool = ref(POOL), modelValue }: { pool?: Ref<FrontXoPool | undefined>; modelValue?: unknown } = {}
) {
  const model = ref(modelValue)

  const wrapper = mountWithSelect(() => {
    const { interfacesSelectId } = useNetworkPifSelect(pool, model, {
      networkType: NETWORK_TYPE.PHYSICAL,
      value: 'id',
      ...options,
    })

    return () => h(VtsSelect, { id: interfacesSelectId, accent: 'brand' })
  })

  return { wrapper, model }
}

async function findOfferedPifIds(options: Partial<PifSelectOptions> = {}) {
  const { wrapper } = mountPifSelect(options)
  await openSelect(wrapper)

  return findAllGenericComponents(wrapper, 'VtsOption').map(option => option.props('option').source.id)
}

describe('options', () => {
  it('offers the PIFs of the pool master that are neither VLANs nor bond slaves', async () => {
    xoCollectionsMock.pifs.value = [
      createMasterPif('eth0'),
      createMasterPif('bond0', { isBondMaster: true }),
      createMasterPif('eth1', { isBondSlave: true }),
      createMasterPif('eth0.10', { vlan: 10 }),
      createPif({ id: 'eth0-of-another-host' as FrontXoPif['id'], $host: OTHER_POOL.master }),
    ]

    expect(await findOfferedPifIds()).toEqual(['eth0', 'bond0'])
  })

  it('leaves out the bond masters of a bonded network', async () => {
    xoCollectionsMock.pifs.value = [createMasterPif('eth0'), createMasterPif('bond0', { isBondMaster: true })]

    expect(await findOfferedPifIds({ networkType: NETWORK_TYPE.BONDED })).toEqual(['eth0'])
  })

  it('offers, for a private network, the PIFs of the master that can carry its tunnels', async () => {
    xoCollectionsMock.pifs.value = [
      createMasterPif('eth0'),
      createMasterPif('bond0', { isBondMaster: true, physical: false }),
      createMasterPif('eth0.10', { vlan: 10, physical: false }),
      createMasterPif('eth1', { isBondSlave: true }),
      createMasterPif('tunnel0', { physical: false }),
      createMasterPif('eth2', { mode: IP_CONFIGURATION_MODE.NONE }),
      createPif({ id: 'eth0-of-another-host' as FrontXoPif['id'], $host: OTHER_POOL.master }),
    ]

    expect(await findOfferedPifIds({ networkType: NETWORK_TYPE.PRIVATE })).toEqual(['eth0', 'bond0', 'eth0.10'])
  })

  it('labels each PIF with the name of its network, or its device without one', async () => {
    xoCollectionsMock.networks.value = [createNetwork({ name_label: 'Pool-wide network' })]
    xoCollectionsMock.pifs.value = [
      createMasterPif('eth0', { $network: createNetwork().id }),
      createMasterPif('eth1', { $network: 'network-unknown' as FrontXoPif['$network'] }),
    ]
    const { wrapper } = mountPifSelect()

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual(['Pool-wide network', 'eth1'])
  })

  it('details each PIF with its device, and its VLAN for a VLAN', async () => {
    xoCollectionsMock.pifs.value = [createMasterPif('eth0'), createMasterPif('eth0.10', { device: 'eth0', vlan: 10 })]
    const { wrapper } = mountPifSelect({ networkType: NETWORK_TYPE.PRIVATE })

    await openSelect(wrapper)

    expect(
      findAllGenericComponents(wrapper, 'VtsOption').map(option => option.props('option').properties.details)
    ).toEqual(['eth0', t('pif-device-vlan', { device: 'eth0', vlan: 10 })])
  })
})

describe('model', () => {
  it('forgets the selected PIF when the pool changes', async () => {
    const pool = ref<FrontXoPool | undefined>(POOL)
    const { model } = mountPifSelect({}, { pool, modelValue: 'eth0' })

    pool.value = OTHER_POOL
    await nextTick()

    expect(model.value).toBeUndefined()
  })

  it('empties the selected PIFs of a multiple select when the pool changes', async () => {
    const pool = ref<FrontXoPool | undefined>(POOL)
    const { model } = mountPifSelect({ multiple: true }, { pool, modelValue: ['eth0', 'eth1'] })

    pool.value = OTHER_POOL
    await nextTick()

    expect(model.value).toEqual([])
  })
})
