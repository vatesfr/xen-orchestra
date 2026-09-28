import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoKubernetesClusterUtils(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const { d, t } = useI18n()

  const cluster = toComputed(rawCluster)

  const createdAtDate = computed(() => (cluster.value.created_at ? new Date(cluster.value.created_at) : undefined))

  const createdAtFormatted = computed(() => {
    if (createdAtDate.value === undefined) {
      return t('unknown')
    }

    return d(createdAtDate.value, { dateStyle: 'long' })
  })

  const createdAtTooltip = computed(() => {
    if (createdAtDate.value === undefined) {
      return t('unknown')
    }

    return d(createdAtDate.value, { dateStyle: 'long', timeStyle: 'medium' })
  })

  return {
    createdAtFormatted,
    createdAtTooltip,
  }
}
