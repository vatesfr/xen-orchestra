import type { FrontXoPool } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { useV2vConnection } from '@/modules/v2v/composables/use-v2v-connection.composable.ts'
import { useV2vPoolName } from '@/modules/v2v/composables/use-v2v-pool-name.composable.ts'
import { computed, type MaybeRefOrGetter } from 'vue'

export function useV2vSourceAndDestination(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { connection } = useV2vConnection()

  const sourceHost = computed(() => connection.value?.host)

  const poolName = useV2vPoolName(rawPoolId)

  return { sourceHost, poolName }
}
