import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useButtonIconColumn } from '@core/tables/column-definitions/button-icon-column.ts'
import { useInputColumn } from '@core/tables/column-definitions/input-column.ts'
import { useSelectColumn } from '@core/tables/column-definitions/select-column.ts'
import { useI18n } from 'vue-i18n'

export const useNewVmSrColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    sr: useSelectColumn({
      headerLabel: () => t('storage-repositories'),
      headerIcon: 'fa:database',
    }),

    diskName: useInputColumn({
      headerLabel: () => t('disk-name'),
      placeholder: () => t('disk-name'),
    }),

    size: useInputColumn({
      type: 'number',
      headerLabel: () => `${t('size')} (GB)`,
    }),

    description: useInputColumn({
      headerLabel: () => t('description'),
      placeholder: () => t('description'),
    }),

    remove: useButtonIconColumn({ buttonIcon: 'fa:trash' }),
  }
})
