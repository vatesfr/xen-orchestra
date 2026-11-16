import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useInfoColumn } from '@core/tables/column-definitions/info-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useV2vMappingColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useTextColumn({ headerLabel: () => t('vm') }),
    kind: useTagColumn({ headerLabel: () => t('type') }),
    mapping: useTextColumn({ headerLabel: () => t('mapping') }),
    check: useInfoColumn({ headerLabel: () => t('checks') }),
    actions: useActionColumn({}),
  }
})
