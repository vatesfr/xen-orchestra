import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vConnectionStore } from '@/modules/v2v/stores/v2v-connection.store.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// What a migration list goes from and to: each stays `undefined` until connected, chosen and loaded
export function useV2vSourceAndDestination(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const connectionStore = useV2vConnectionStore()

  const { getPoolById } = useXoPoolCollection()

  const sourceHost = computed(() => connectionStore.connection?.host)

  const poolName = computed(() => getPoolById(toValue(rawPoolId))?.name_label)

  return { sourceHost, poolName }
}
