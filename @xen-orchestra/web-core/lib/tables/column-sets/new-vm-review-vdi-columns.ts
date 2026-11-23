import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useRankColumn } from '@core/tables/column-definitions/rank-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useNewVmReviewVdiColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    rank: useRankColumn({ highlighted: true }),
    sr: useTextColumn({ headerLabel: () => t('storage-repositories') }),
    diskName: useTextColumn({ headerLabel: () => t('disk-name') }),
    size: useNumberColumn({ headerLabel: () => t('size') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    creation: useTextColumn({ headerLabel: () => t('new-vm:vdi-creation') }),
    marker: useLiteralColumn(),
  }
})
