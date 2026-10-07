import { useNewInternalNetworkForm } from '@/modules/network/form/new-internal/use-new-internal-network-form.ts'
import type { FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { createPool } from '@/test/create-pool.ts'
import { mountComposable } from '@/test/mount-composable.ts'
import { computed, type MaybeRefOrGetter, ref, toValue } from 'vue'

const POOL_ID = 'pool-789' as FrontXoPool['id']

vi.mock(import('@/modules/pool/remote-resources/use-xo-pool-collection.ts'), () => ({
  useXoPoolCollection: (() => {
    const pools = ref([createPool({ id: POOL_ID })])

    return {
      pools,
      useGetPoolById: (id: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) =>
        computed(() => pools.value.find(pool => pool.id === toValue(id))),
    }
  }) as unknown as typeof useXoPoolCollection,
}))

function mountNewInternalNetworkForm() {
  return mountComposable(() => useNewInternalNetworkForm(POOL_ID)).wrapper.vm
}

describe('validateAndBuildPayload', () => {
  it('builds the payload from the base fields', async () => {
    const result = mountNewInternalNetworkForm()

    result.nameInputBindings['onUpdate:modelValue']('Internal network')

    await expect(result.validateAndBuildPayload()).resolves.toEqual({ poolId: POOL_ID, name: 'Internal network' })
  })

  it('builds no payload when the name is empty', async () => {
    const result = mountNewInternalNetworkForm()

    await expect(result.validateAndBuildPayload()).resolves.toBeUndefined()
  })
})
