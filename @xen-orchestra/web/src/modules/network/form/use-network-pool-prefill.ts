import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { whenever } from '@vueuse/core'
import { computed, type MaybeRefOrGetter, type Ref } from 'vue'

export function useNetworkPoolPrefill(
  _poolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>,
  model: Ref<FrontXoPool['id'] | undefined>
) {
  const poolId = toComputed(_poolId)
  const { pools } = useXoPoolCollection()

  const targetPool = computed(() => pools.value.find(pool => pool.id === poolId.value))

  whenever(
    targetPool,
    pool => {
      model.value = pool.id
    },
    { immediate: true, once: true }
  )
}
