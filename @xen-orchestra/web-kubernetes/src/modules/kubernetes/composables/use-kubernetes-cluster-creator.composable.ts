import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { useXoUserResource } from '@/modules/user/remote-resources/use-xo-user.ts'
import { computed, type MaybeRefOrGetter, toValue } from 'vue'

export function useKubernetesClusterCreator(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const creatorId = computed(() => toValue(rawCluster).created_by_xo_user_id)

  const { user } = useXoUserResource({ isEnabled: computed(() => creatorId.value !== undefined) }, creatorId)

  const creatorLabel = computed(() => user.value?.username || user.value?.email)

  return { creatorLabel }
}
