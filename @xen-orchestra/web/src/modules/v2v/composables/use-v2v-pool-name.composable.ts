import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vSourceAndDestination } from '@/modules/v2v/composables/use-v2v-source-and-destination.composable.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

// A pool still loading is named by its id rather than not at all
export function useV2vPoolName(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>) {
  const { poolName } = useV2vSourceAndDestination(rawPoolId)

  return computed(() => poolName.value ?? toValue(rawPoolId))
}
