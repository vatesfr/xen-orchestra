import type { XoKubernetesNode } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

export function useXoKubernetesNodeUtils() {
  const { t } = useI18n()

  const roleLabels = computed<Record<XoKubernetesNode['role'], string>>(() => ({
    'control-plane': t('control-plane'),
    worker: t('worker'),
  }))

  return {
    roleLabels,
  }
}
