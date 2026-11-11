import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useContainerHostColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkColumn({ headerLabel: () => t('vm') }),
    type: useTextColumn({ headerLabel: () => t('type') }),
    connection: useTagColumn({ headerLabel: () => t('connection') }),
  }
})
