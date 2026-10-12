import { useKubernetesStatusColumn } from '@/modules/kubernetes/tables/column-definitions/kubernetes-status-column.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useKubernetesClusterColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    cluster: useLinkColumn({ headerLabel: () => t('cluster') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    status: useKubernetesStatusColumn({ headerLabel: () => t('status') }),
    controlPlaneNodes: useNumberColumn({ headerLabel: () => t('control-plane-replicas') }),
    workerNodes: useNumberColumn({ headerLabel: () => t('worker-replicas') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
    actions: useActionColumn({}),
  }
})
