import type { FrontXoNetwork } from '@/modules/network/remote-resources/use-xo-network-collection.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import type { FrontXoSr } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { useV2vDestinationForm, type V2vDestinationForm } from '@/modules/v2v/form/use-v2v-destination-form.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import type { FrontXoVmTemplate } from '@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'
import { ONE_GB } from '@/shared/constants.ts'
import { createHost } from '@/test/create-host.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vDestinationDefaults, createV2vMigrationList } from '@/test/create-v2v-migration-list.ts'
import { dangerMessage } from '@/test/form-messages.ts'
import { t } from '@/test/i18n.ts'
import { destinationCollectionsMock } from '@/test/mock-xo-destination-collections.ts'
import { mountComposableWithI18n } from '@/test/mount-composable.ts'
import { mountWithSelect } from '@/test/mount-with-select.ts'
import { findSelectOptionLabels, openSelect } from '@/test/select.ts'
import type { FormSelectId } from '@core/packages/form-select'
import VtsSelect from '@core/components/select/VtsSelect.vue'
import { h, nextTick, ref } from 'vue'

vi.mock(
  import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/host/remote-resources/use-xo-host-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/network/remote-resources/use-xo-network-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/pbd/remote-resources/use-xo-pbd-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/pif/remote-resources/use-xo-pif-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)
vi.mock(
  import('@/modules/vm/remote-resources/use-xo-vm-template-collection.ts'),
  () => import('@/test/mock-xo-destination-collections.ts')
)

const POOL = createPool()

const OTHER_POOL = createPool({
  id: 'pool-2' as FrontXoPool['id'],
  master: 'host-2' as FrontXoPool['master'],
  default_SR: 'sr-2' as FrontXoPool['default_SR'],
})

const MANAGEMENT_NETWORK_ID = 'network-mgmt' as FrontXoNetwork['id']

const OTHER_MANAGEMENT_NETWORK_ID = 'network-mgmt-2' as FrontXoNetwork['id']

function seedTwoPools() {
  destinationCollectionsMock.pools.value = [POOL, OTHER_POOL]
  destinationCollectionsMock.srs.value = [createSr(), createSr({ id: OTHER_POOL.default_SR, $pool: OTHER_POOL.id })]
  destinationCollectionsMock.pifs.value = [
    createManagementPif(POOL, MANAGEMENT_NETWORK_ID),
    createManagementPif(OTHER_POOL, OTHER_MANAGEMENT_NETWORK_ID),
  ]
}

function mountDestinationForm({
  storedList,
  areCollectionsLoaded = true,
}: { storedList?: V2vMigrationList; areCollectionsLoaded?: boolean } = {}) {
  if (areCollectionsLoaded) {
    seedTwoPools()
  }

  return mountComposableWithI18n(() => useV2vDestinationForm({ pool: ref(), storedList }))
}

// The options of a select only show once rendered, here for the first pool
function mountFormSelect(getSelectId: (form: V2vDestinationForm) => FormSelectId) {
  seedTwoPools()

  return mountWithSelect(() => {
    const form = useV2vDestinationForm({ pool: ref(POOL.id), storedList: undefined })

    return () => h(VtsSelect, { id: getSelectId(form), accent: 'brand' })
  })
}

async function choosePool(form: ReturnType<typeof mountDestinationForm>, poolId: FrontXoPool['id']) {
  form.formData.pool = poolId
  await nextTick()
}

beforeEach(() => {
  destinationCollectionsMock.reset()
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

    await choosePool(form, POOL.id)

    expect(form.formData).toEqual({
      pool: POOL.id,
      sr: POOL.default_SR,
      network: MANAGEMENT_NETWORK_ID,
      template: undefined,
    })
  })

  it('prefills again when another pool is chosen', async () => {
    const form = mountDestinationForm()
    await choosePool(form, POOL.id)
    form.formData.template = 'template-123' as FrontXoVmTemplate['id']

    await choosePool(form, OTHER_POOL.id)

    expect(form.formData).toEqual({
      pool: OTHER_POOL.id,
      sr: OTHER_POOL.default_SR,
      network: OTHER_MANAGEMENT_NETWORK_ID,
      template: undefined,
    })
  })

  it('prefills the defaults of the list stored for the pool', async () => {
    const storedList = createV2vMigrationList()
    const form = mountDestinationForm({ storedList })

    await choosePool(form, POOL.id)

    expect(form.formData).toEqual({ pool: POOL.id, ...storedList.defaults })
  })

  it('prefills once the collections are loaded', async () => {
    const form = mountDestinationForm({ areCollectionsLoaded: false })
    await choosePool(form, POOL.id)

    seedTwoPools()
    await nextTick()

    expect(form.formData.sr).toBe(POOL.default_SR)
  })

  it('keeps the SR the user chose when the collections update', async () => {
    const form = mountDestinationForm()
    await choosePool(form, POOL.id)
    const chosenSr = 'sr-chosen' as FrontXoSr['id']
    form.formData.sr = chosenSr

    destinationCollectionsMock.srs.value = [...destinationCollectionsMock.srs.value, createSr({ id: chosenSr })]
    await nextTick()

    expect(form.formData.sr).toBe(chosenSr)
  })
})

describe('defaults', () => {
  it('is undefined while a default is missing', async () => {
    const form = mountDestinationForm()

    await choosePool(form, POOL.id)

    expect(form.defaults).toBeUndefined()
  })

  it('is the chosen SR, network and template', async () => {
    const defaults = createV2vDestinationDefaults()
    const form = mountDestinationForm()
    await choosePool(form, POOL.id)

    form.formData.template = defaults.template

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
    await choosePool(form, POOL.id)

    form.formData.template = createV2vDestinationDefaults().template

    expect(await form.validate()).toBe(true)
  })
})

describe('selectedPool', () => {
  it('is the chosen pool', async () => {
    const form = mountDestinationForm()

    await choosePool(form, OTHER_POOL.id)

    expect(form.selectedPool).toEqual(OTHER_POOL)
  })
})

describe('poolSelectBindings', () => {
  it('offers each pool with the counts of its hosts, writable SRs and networks', async () => {
    const wrapper = mountFormSelect(form => form.poolSelectBindings.value.id)
    destinationCollectionsMock.hosts.value = [createHost()]
    destinationCollectionsMock.networks.value = [createNetwork()]

    await openSelect(wrapper)

    expect(
      wrapper.findAllComponents({ name: 'VtsOption' }).map(option => option.props('option').properties.counts)
    ).toEqual([
      { hosts: 1, srs: 1, networks: 1 },
      { hosts: 0, srs: 1, networks: 0 },
    ])
  })
})

describe('srSelectBindings', () => {
  it.each([
    ['its free space', createSr({ shared: true }), 9],
    ['no free space once it uses more than its size', createSr({ shared: true, physical_usage: 20 * ONE_GB }), 0],
  ])('offers each SR of the pool with its location and %s', async (_, sr, gbLeft) => {
    const wrapper = mountFormSelect(form => form.srSelectBindings.value.id)
    destinationCollectionsMock.srs.value = [sr]

    await openSelect(wrapper)

    expect(findSelectOptionLabels(wrapper)).toEqual([
      `${sr.name_label} (${t('shared')}) - ${t('n-gb-left', { n: gbLeft })}`,
    ])
  })
})
