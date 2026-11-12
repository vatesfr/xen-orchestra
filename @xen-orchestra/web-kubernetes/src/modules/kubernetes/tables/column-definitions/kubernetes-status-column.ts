import KubernetesStatus from '@/modules/kubernetes/components/KubernetesStatus.vue'
import type { KubernetesStatus as KubernetesStatusValue } from '@/modules/kubernetes/types/xo-kubernetes.type.ts'
import type { HeaderConfig } from '@core/tables/types.ts'
import { defineColumn } from '@core/packages/table/define-column.ts'
import { renderBodyCell } from '@core/tables/helpers/render-body-cell.ts'
import { renderHeadCell } from '@core/tables/helpers/render-head-cell.ts'
import { h } from 'vue'
import { useI18n } from 'vue-i18n'

export const useKubernetesStatusColumn = defineColumn((config?: HeaderConfig) => {
  const { t } = useI18n()

  return {
    renderHead: () => renderHeadCell(config?.headerLabel ?? t('status')),
    renderBody: (status: KubernetesStatusValue) => renderBodyCell(() => h(KubernetesStatus, { status })),
  }
})
