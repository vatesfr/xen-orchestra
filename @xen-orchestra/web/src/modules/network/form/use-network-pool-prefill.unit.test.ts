import { useNetworkPoolPrefill } from '@/modules/network/form/use-network-pool-prefill.ts'
import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool, OTHER_POOL_ID, UNKNOWN_POOL_ID } from '@/test/create-pool.ts'
import { HOLD_LOADING } from '@/test/hold-loading.ts'
import { xoCollectionsMock, mockXoCollections } from '@/test/mock-xo-collections.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { nextTick, ref } from 'vue'

mockXoCollections('pool')

const POOL = createPool()

beforeEach(() => {
  xoCollectionsMock.reset()
})

function mountPrefill(poolId: FrontXoPool['id'], model = ref<FrontXoPool['id'] | undefined>()) {
  mountComposable(() => {
    useNetworkPoolPrefill(poolId, model)

    return {}
  })

  return model
}

it('prefills the model with the given pool', () => {
  xoCollectionsMock.pools.value = [POOL]

  expect(mountPrefill(POOL.id).value).toBe(POOL.id)
})

it('leaves the model empty when no pool has the given id', () => {
  xoCollectionsMock.pools.value = [POOL]

  expect(mountPrefill(UNKNOWN_POOL_ID).value).toBeUndefined()
})

it('prefills the model once the pools are loaded', async () => {
  HOLD_LOADING.pools()
  const model = mountPrefill(POOL.id)

  xoCollectionsMock.pools.value = [POOL]
  await nextTick()

  expect(model.value).toBe(POOL.id)
})

it('keeps the pool chosen after the prefill when the pools update', async () => {
  xoCollectionsMock.pools.value = [POOL]
  const model = mountPrefill(POOL.id)

  model.value = OTHER_POOL_ID
  xoCollectionsMock.pools.value = [{ ...POOL }]
  await nextTick()

  expect(model.value).toBe(OTHER_POOL_ID)
})

it('replaces a pool chosen before the pools are loaded', async () => {
  HOLD_LOADING.pools()
  const model = mountPrefill(POOL.id, ref(OTHER_POOL_ID))

  xoCollectionsMock.pools.value = [POOL]
  await nextTick()

  expect(model.value).toBe(POOL.id)
})
