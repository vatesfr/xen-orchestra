import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vPoolQuery } from '@/modules/v2v/composables/use-v2v-pool-query.composable.ts'
import { createV2vWizardRouter } from '@/test/create-v2v-wizard-router.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { flushPromises } from '@vue/test-utils'
import type { LocationQueryRaw } from 'vue-router'

const POOL_ID = 'pool-789' as FrontXoPool['id']

async function mountPoolQuery(query: LocationQueryRaw = {}) {
  const router = await createV2vWizardRouter('destination', query)

  const result = mountComposable(() => ({ pool: useV2vPoolQuery() }), { router }).wrapper.vm

  return { result, router }
}

it.each([
  ['holds no pool', {}],
  ['holds an empty pool', { pool: '' }],
])('is undefined while the route %s', async (_, query) => {
  const { result } = await mountPoolQuery(query)

  expect(result.pool).toBeUndefined()
})

it('is the pool of the route', async () => {
  const { result } = await mountPoolQuery({ pool: POOL_ID })

  expect(result.pool).toBe(POOL_ID)
})

it('writes the pool in the route, next to the other parameters', async () => {
  const { result, router } = await mountPoolQuery()

  result.pool = POOL_ID
  await flushPromises()

  expect(router.currentRoute.value.query).toEqual({ step: 'destination', pool: POOL_ID })
})

it('removes the pool from the route once it is cleared', async () => {
  const { result, router } = await mountPoolQuery({ pool: POOL_ID })

  result.pool = undefined
  await flushPromises()

  expect(router.currentRoute.value.query).toEqual({ step: 'destination' })
})
