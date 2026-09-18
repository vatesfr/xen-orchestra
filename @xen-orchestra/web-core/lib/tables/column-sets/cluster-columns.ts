import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useClusterColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    cluster: useLinkColumn({ headerLabel: () => t('cluster') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    controlPlaneNodes: useTextColumn({ headerLabel: () => t('control-plane-nodes') }),
    workerNodes: useTextColumn({ headerLabel: () => t('worker-nodes') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
    selectItem: useSelectItemColumn(),
  }
})
