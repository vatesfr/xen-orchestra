import { type FrontXoPool, useXoPoolCollection } from '@/modules/pool/remote-resources/use-xo-pool-collection.ts'
import { getV2vTargetName } from '@/modules/v2v/utils/v2v-mapping.util.ts'
import { computed, type ComputedRef, type MaybeRefOrGetter, toValue } from 'vue'

export function useV2vPoolName(rawPoolId: MaybeRefOrGetter<FrontXoPool['id']>): ComputedRef<string>
export function useV2vPoolName(
  rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>
): ComputedRef<string | undefined>
export function useV2vPoolName(rawPoolId: MaybeRefOrGetter<FrontXoPool['id'] | undefined>) {
  const { getPoolById } = useXoPoolCollection()

  return computed(() => getV2vTargetName(toValue(rawPoolId), getPoolById))
}
