import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useRankColumn } from '@core/tables/column-definitions/rank-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useNewVmReviewVifColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    rank: useRankColumn({ highlighted: true }),
    network: useTextColumn({ headerLabel: () => t('network') }),
    mac: useTextColumn({ headerLabel: () => t('mac-addresses') }),
    marker: useLiteralColumn(),
  }
})
