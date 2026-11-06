import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vDestinationStep } from '@/modules/v2v/composables/use-v2v-destination-step.composable.ts'
import type { V2vMigrationList } from '@/modules/v2v/types/v2v-migration-list.type.ts'
import { chooseCompleteV2vDestination, chooseV2vDestinationPool } from '@/test/choose-v2v-destination.ts'
import { createNetwork } from '@/test/create-network.ts'
import { createManagementPif } from '@/test/create-pif.ts'
import { createPool } from '@/test/create-pool.ts'
import { createSr } from '@/test/create-sr.ts'
import { createV2vConnection } from '@/test/create-v2v-connection.ts'
import {
  createV2vDestinationDefaults,
  createV2vMigrationList,
  createV2vMigrationListVms,
} from '@/test/create-v2v-migration-list.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { createVmTemplate } from '@/test/create-vm-template.ts'
import { xoCollectionsMock } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { createConnectedV2vContext, v2vConnectionProvide } from '@/test/v2v-connection-provide.ts'
import { readV2vMigrationListStorage, seedV2vMigrationList } from '@/test/v2v-migration-list-storage.ts'
import { flushPromises } from '@vue/test-utils'
import { nextTick } from 'vue'

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

const CONNECTION = createV2vConnection()

const UNKNOWN_POOL_ID = 'pool-unknown' as FrontXoPool['id']

const DEFAULTS = createV2vDestinationDefaults({ sr: POOL.default_SR })

const STORED_TEMPLATE_ID = 'template-stored' as V2vMigrationList['defaults']['template']

async function mountDestinationStep(query: Record<string, string> = {}) {
  xoCollectionsMock.pools.value = [POOL]
  xoCollectionsMock.srs.value = [createSr()]
  xoCollectionsMock.networks.value = [createNetwork({ id: DEFAULTS.network })]
  xoCollectionsMock.pifs.value = [createManagementPif(POOL, DEFAULTS.network)]
  // The stored defaults are only prefilled once the pool offers them
  xoCollectionsMock.templates.value = [createVmTemplate({ id: STORED_TEMPLATE_ID })]
  const router = await createV2vWizardRouter('destination', query)

  const result = mountComposable(() => useV2vDestinationStep(), {
    router,
    provide: v2vConnectionProvide(createConnectedV2vContext({ connection: CONNECTION })),
  }).wrapper.vm

  return { result, router }
}

beforeEach(() => {
  localStorage.clear()
  xoCollectionsMock.reset()
})

describe('form', () => {
  it('opens on the pool of the route', async () => {
    const { result } = await mountDestinationStep({ pool: POOL.id })

    expect(result.form.formData.pool).toBe(POOL.id)
  })

  it('clears an unknown pool of the route once the pools are known', async () => {
    const { result, router } = await mountDestinationStep({ pool: UNKNOWN_POOL_ID })
    await flushPromises()

    expect(result.form.formData.pool).toBeUndefined()
    expect(router.currentRoute.value.query).not.toHaveProperty('pool')
  })

  it('waits for the pools to be known before clearing an unknown pool of the route', async () => {
    xoCollectionsMock.arePoolsReady.value = false
    const { result } = await mountDestinationStep({ pool: UNKNOWN_POOL_ID })

    expect(result.form.formData.pool).toBe(UNKNOWN_POOL_ID)

    xoCollectionsMock.arePoolsReady.value = true
    await flushPromises()

    expect(result.form.formData.pool).toBeUndefined()
  })

  it('writes the chosen pool in the route', async () => {
    const { result, router } = await mountDestinationStep()

    result.form.formData.pool = POOL.id
    await flushPromises()

    expect(router.currentRoute.value.query.pool).toBe(POOL.id)
  })

  it('removes the pool from the route once it is cleared', async () => {
    const { result, router } = await mountDestinationStep({ pool: POOL.id })

    result.form.formData.pool = undefined
    await flushPromises()

    expect(router.currentRoute.value.query).not.toHaveProperty('pool')
  })

  it('prefills the defaults of the list stored for the chosen pool', async () => {
    const storedList = createV2vMigrationList({
      defaults: createV2vDestinationDefaults({ template: STORED_TEMPLATE_ID }),
    })
    seedV2vMigrationList(storedList)
    const { result } = await mountDestinationStep()

    await chooseV2vDestinationPool(result.form, POOL.id)

    expect(result.form.formData).toEqual({ pool: POOL.id, ...storedList.defaults })
  })
})

describe('existingList', () => {
  it('is the source, the pool and the VM count of the list stored for the chosen pool', async () => {
    seedV2vMigrationList(createV2vMigrationList({ vms: createV2vMigrationListVms(4) }))

    const { result } = await mountDestinationStep({ pool: POOL.id })

    expect(result.existingList).toEqual({ sourceHost: CONNECTION.host, poolName: POOL.name_label, vmCount: 4 })
  })

  it.each([
    ['no list is stored', undefined],
    ['the stored list holds no VM', createV2vMigrationList()],
  ])('is undefined when %s', async (_, storedList) => {
    if (storedList !== undefined) {
      seedV2vMigrationList(storedList)
    }

    const { result } = await mountDestinationStep({ pool: POOL.id })

    expect(result.existingList).toBeUndefined()
  })

  it('is undefined while the chosen pool is missing from the pools', async () => {
    seedV2vMigrationList(createV2vMigrationList({ vms: createV2vMigrationListVms(4) }))
    const { result } = await mountDestinationStep({ pool: POOL.id })

    xoCollectionsMock.pools.value = []
    await nextTick()

    expect(result.existingList).toBeUndefined()
  })

  it('is undefined until a pool is chosen', async () => {
    seedV2vMigrationList(createV2vMigrationList({ vms: createV2vMigrationListVms(4) }))

    const { result } = await mountDestinationStep()

    expect(result.existingList).toBeUndefined()
  })
})

describe('submit', () => {
  it('stores nothing and stays on the step while the destination is incomplete', async () => {
    const { result, router } = await mountDestinationStep({ pool: POOL.id })

    await result.submit()
    await flushPromises()

    expect(readV2vMigrationListStorage()).toBeNull()
    expect(router.currentRoute.value.query.step).toBe('destination')
  })

  it('stores the list with its defaults and opens the VMs step on the same pool', async () => {
    const { result, router } = await mountDestinationStep()
    await chooseCompleteV2vDestination(result.form, POOL.id, DEFAULTS.template)

    await result.submit()
    await flushPromises()

    expect(readV2vMigrationListStorage()).toEqual(createV2vMigrationList({ defaults: DEFAULTS }))
    expect(router.currentRoute.value.query).toMatchObject({ step: 'vms', pool: POOL.id })
  })
})

describe('back', () => {
  it('goes back to the source step', async () => {
    const { result, router } = await mountDestinationStep({ pool: POOL.id })

    await result.back()

    expect(router.currentRoute.value.query).toMatchObject({ step: 'source', pool: POOL.id })
  })
})
