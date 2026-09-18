import type { XoKubernetesCluster } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { toComputed } from '@core/utils/to-computed.util.ts'
import { computed, type MaybeRefOrGetter } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoKubernetesClusterUtils(rawCluster: MaybeRefOrGetter<XoKubernetesCluster>) {
  const { d, locale, t } = useI18n()

  const cluster = toComputed(rawCluster)

  const createdAtDate = computed(() => (cluster.value.createdAt ? new Date(cluster.value.createdAt) : undefined))

  const createdAtFormatted = computed(() => {
    if (createdAtDate.value === undefined) {
      return t('unknown')
    }

    return new Intl.DateTimeFormat(locale.value, { dateStyle: 'long' }).format(createdAtDate.value)
  })

  const createdAtTooltip = computed(() => {
    if (createdAtDate.value === undefined || createdAtFormatted.value === undefined) {
      return t('unknown')
    }

    return `${createdAtFormatted.value}, ${d(createdAtDate.value, { timeStyle: 'medium' })}`
  })

  return {
    createdAtFormatted,
    createdAtTooltip,
  }
}
