import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useCheckboxColumn } from '@core/tables/column-definitions/checkbox-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useI18n } from 'vue-i18n'

export const usePrivilegeScopeObjectColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    checkbox: useCheckboxColumn(),
    object: useLinkColumn({ headerLabel: () => t('name') }),
  }
})
