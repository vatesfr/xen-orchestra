import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useXoSrUtils } from '@/modules/storage-repository/composables/xo-sr-utils.composable.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vDestinationForm, type V2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { chooseCompleteV2vDestination, chooseV2vDestinationPool } from '@/test/choose-v2v-destination.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vDestinationDefaults, createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { findAllGenericComponents } from '@/test/find-generic-components.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { seedV2vDestinationPools } from '@/test/seed-v2v-destination-pools.ts'
import { findSelectOptionLabels, findShownSelections, openSelect } from '@/test/select.ts'
import type { FormSelectId } from '@core/packages/form-select'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { flushPromises } from '@vue/test-utils'
import { h, nextTick, ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-collections.ts')
)

const POOL = createPool()

const OTHER_POOL = createPool({
  id: 'pool-2' as FrontXoPool['id'],
  master: 'host-2' as FrontXoPool['master'],
  default_SR: 'sr-2' as FrontXoPool['default_SR'],
})

const MANAGEMENT_NETWORK_ID = 'network-mgmt' as FrontXoNetwork['id']

const OTHER_MANAGEMENT_NETWORK_ID = 'network-mgmt-2' as FrontXoNetwork['id']

const STORED_LIST = createV2vMigrationList()

function seedTwoPools() {
  seedV2vDestinationPools([
    { pool: POOL, managementNetworkId: MANAGEMENT_NETWORK_ID },
    { pool: OTHER_POOL, managementNetworkId: OTHER_MANAGEMENT_NETWORK_ID },
  ])
}

function mountDestinationForm({
  poolId,
  storedList,
  areCollectionsLoaded = true,
}: { poolId?: FrontXoPool['id']; storedList?: V2vMigrationList; areCollectionsLoaded?: boolean } = {}) {
  if (areCollectionsLoaded) {
    seedTwoPools()
  }

  return mountComposableWithI18n(() => useV2vDestinationForm({ poolId: ref(poolId), storedList }))
}

// The options and the selection of a select only show once rendered, here on the first pool
function mountSelects(getSelectIds: (form: V2vDestinationForm) => FormSelectId[], storedList?: V2vMigrationList) {
  return mountWithSelect(() => {
    const form = useV2vDestinationForm({ poolId: ref(POOL.id), storedList })

    return () =>
      h(
        'div',
        getSelectIds(form).map(id => h(VtsSelect, { id, accent: 'brand' }))
      )
  })
}

const LATE_COLLECTIONS = {
  srs: () => {
    xoCollectionsMock.srs.value = [createSr({ shared: true })]
  },
  networks: () => {
    xoCollectionsMock.networks.value = [createNetwork(), createNetwork({ id: MANAGEMENT_NETWORK_ID })]
  },
  pifs: () => {
    xoCollectionsMock.pifs.value = [createManagementPif(POOL, MANAGEMENT_NETWORK_ID)]
  },
  templates: () => {
    xoCollectionsMock.templates.value = [createVmTemplate()]
  },
}

const LOADING_ORDER = ['srs', 'networks', 'pifs', 'templates'] as const

const LOADING_ORDERS = [
  ['in loading order', LOADING_ORDER],
  ['in reverse order', [...LOADING_ORDER].reverse()],
] as const

async function loadCollectionsOneByOne(order: readonly (keyof typeof LATE_COLLECTIONS)[]) {
  for (const collection of order) {
    LATE_COLLECTIONS[collection]()
    await flushPromises()
  }
}

beforeEach(() => {
  xoCollectionsMock.reset()
})

describe('formData', () => {
  it('starts empty', () => {
    expect(mountDestinationForm().formData).toEqual({
      pool: undefined,
      sr: undefined,
      network: undefined,
      template: undefined,
    })
  })

  it('prefills the pool default SR and the management network of its master once a pool is chosen', async () => {
    const form = mountDestinationForm()

    await chooseV2vDestinationPool(form, POOL.id)

    expect(form.formData).toEqual({
      pool: POOL.id,
      sr: POOL.default_SR,
      network: MANAGEMENT_NETWORK_ID,
      template: undefined,
    })
  })

  it('prefills again when another pool is chosen', async () => {
    const form = mountDestinationForm()
    await chooseV2vDestinationPool(form, POOL.id)
    form.formData.template = createVmTemplate().id

    await chooseV2vDestinationPool(form, OTHER_POOL.id)

    expect(form.formData).toEqual({
      pool: OTHER_POOL.id,
      sr: OTHER_POOL.default_SR,
      network: OTHER_MANAGEMENT_NETWORK_ID,
      template: undefined,
    })
  })

  it('prefills the defaults of the list stored for the pool', async () => {
    const form = mountDestinationForm({ storedList: STORED_LIST })

    await chooseV2vDestinationPool(form, POOL.id)

    expect(form.formData).toEqual({ pool: POOL.id, ...STORED_LIST.defaults })
  })

  it.each([
    ['the defaults of the list stored for the pool', STORED_LIST, STORED_LIST.defaults],
    [
      'the pool default SR and the management network of its master',
      undefined,
      { sr: POOL.default_SR, network: MANAGEMENT_NETWORK_ID, template: undefined },
    ],
  ])('prefills %s when the pool is set and the collections are loaded at mount', (_, storedList, expectedDefaults) => {
    const form = mountDestinationForm({ poolId: POOL.id, storedList })

    expect(form.formData).toEqual({ pool: POOL.id, ...expectedDefaults })
  })

  describe.each(LOADING_ORDERS)('on the pool of the route once the collections load %s', (_, order) => {
    it.each([
      ['the defaults of the stored list', STORED_LIST, createNetwork().name_label, createVmTemplate().name_label],
      [
        'the pool prefill without a stored list',
        undefined,
        createNetwork({ id: MANAGEMENT_NETWORK_ID }).name_label,
        '',
      ],
    ])('shows %s', async (_, storedList, networkLabel, templateLabel) => {
      // The destination step opens on the pool of the route while only the pools are loaded: the wizard reads them first
      xoCollectionsMock.pools.value = [POOL, OTHER_POOL]
      const wrapper = mountSelects(
        form => [
          form.srSelectBindings.value.id,
          form.networkSelectBindings.value.id,
          form.templateSelectBindings.value.id,
        ],
        storedList
      )

      await loadCollectionsOneByOne(order)

      expect(findShownSelections(wrapper)).toEqual([
        expect.stringContaining(createSr().name_label),
        networkLabel,
        templateLabel,
      ])
    })
  })

  it('prefills once the collections are loaded', async () => {
    const form = mountDestinationForm({ areCollectionsLoaded: false })
    await chooseV2vDestinationPool(form, POOL.id)

    seedTwoPools()
    await nextTick()

    expect(form.formData.sr).toBe(POOL.default_SR)
  })

  it('keeps the SR the user chose when the collections update', async () => {
    const form = mountDestinationForm()
    await chooseV2vDestinationPool(form, POOL.id)
    const chosenSrId = 'sr-chosen' as FrontXoSr['id']
    form.formData.sr = chosenSrId

    xoCollectionsMock.srs.value = [...xoCollectionsMock.srs.value, createSr({ id: chosenSrId })]
    await nextTick()

    expect(form.formData.sr).toBe(chosenSrId)
  })
})

describe('defaults', () => {
  it('is undefined while a default is missing', async () => {
    const form = mountDestinationForm()

    await chooseV2vDestinationPool(form, POOL.id)

    expect(form.defaults).toBeUndefined()
  })

  it('is the chosen SR, network and template', async () => {
    const defaults = createV2vDestinationDefaults()
    const form = mountDestinationForm()

    await chooseCompleteV2vDestination(form, POOL.id, defaults.template)

    expect(form.defaults).toEqual({ sr: POOL.default_SR, network: MANAGEMENT_NETWORK_ID, template: defaults.template })
  })
})

describe('validate', () => {
  it('requires the pool, the SR, the network and the template', async () => {
    const form = mountDestinationForm()

    expect(await form.validate()).toBe(false)
    expect(form.poolSelectBindings.error).toEqual(dangerMessage(form.t('pool-required')))
    expect(form.srSelectBindings.error).toEqual(dangerMessage(form.t('sr-required')))
    expect(form.networkSelectBindings.error).toEqual(dangerMessage(form.t('network-required')))
    expect(form.templateSelectBindings.error).toEqual(dangerMessage(form.t('template-required')))
  })

  it('accepts a complete destination', async () => {
    const form = mountDestinationForm()

    await chooseCompleteV2vDestination(form, POOL.id, createV2vDestinationDefaults().template)

    expect(await form.validate()).toBe(true)
  })
})

describe('selectedPool', () => {
  it('is the chosen pool', async () => {
    const form = mountDestinationForm()

    await chooseV2vDestinationPool(form, OTHER_POOL.id)

    expect(form.selectedPool).toEqual(OTHER_POOL)
  })
})

describe('poolSelectBindings', () => {
  it('offers each pool with the counts of its hosts, writable SRs and networks', async () => {
    seedTwoPools()
    const wrapper = mountSelects(form => [form.poolSelectBindings.value.id])
    xoCollectionsMock.hosts.value = [createHost()]
    xoCollectionsMock.networks.value = [createNetwork()]

    await openSelect(wrapper)

    expect(
      findAllGenericComponents(wrapper, 'VtsOption').map(option => option.props('option').properties.counts)
    ).toEqual([
      { hosts: 1, srs: 1, networks: 1 },
      { hosts: 0, srs: 1, networks: 0 },
    ])
  })
})

describe('srSelectBindings', () => {
  it('offers each SR of the pool with its select label', async () => {
    const sr = createSr({ shared: true })
    seedTwoPools()
    const wrapper = mountSelects(form => [form.srSelectBindings.value.id])
    xoCollectionsMock.srs.value = [sr]

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual([
      mountComposableWithI18n(() => useXoSrUtils()).getSrSelectLabel(sr),
    ])
  })
})
