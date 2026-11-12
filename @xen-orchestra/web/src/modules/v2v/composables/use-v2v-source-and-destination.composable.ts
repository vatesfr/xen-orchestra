import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// What a migration list goes from and to: each stays `undefined` until connected and chosen. A pool the pools do not
// hold yet is named by its id
export function useV2vSourceAndDestination(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { connection } = useV2vConnection()

  const { getPoolById } = useXoPoolCollection()

  const sourceHost = computed(() => connection.value?.host)

  const poolName = computed(() => {
    const poolId = toValue(rawPoolId)

    return poolId === undefined ? undefined : (getPoolById(poolId)?.name_label ?? poolId)
  })

  return { sourceHost, poolName }
}
