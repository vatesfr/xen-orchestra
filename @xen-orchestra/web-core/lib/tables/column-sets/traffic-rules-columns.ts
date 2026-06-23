import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useDoubleLinkColumn } from '@core/tables/column-definitions/double-link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useTrafficRulesColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    order: useNumberColumn(),
    policy: useTagColumn({ headerLabel: () => t('policy') }),
    protocol: useTextColumn({
      headerLabel: () => t('protocol:port'),
    }),
    directionA: useTextColumn({ headerLabel: () => t('direction') }),
    target: useTruncatedTextColumn({ headerLabel: () => t('target') }),
    directionB: useTextColumn({
      headerLabel: () => t('direction'),
    }),
    object: useDoubleLinkColumn({ headerLabel: () => t('object') }),
    actions: useActionColumn({}),
  }
})
