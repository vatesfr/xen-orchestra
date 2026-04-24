import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useDoubleLinkColumn } from '@core/tables/column-definitions/double-link-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const useTrafficRulesColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    order: useNumberColumn({ headerIcon: 'fa:hashtag' }),
    policy: useTagColumn({ headerLabel: () => t('traffic-rules:policy') }),
    protocol: useTextColumn({
      headerLabel: () => t('traffic-rules:protocol:port'),
      headerIcon: 'fa:square-caret-down',
    }),
    directionA: useTextColumn({ headerLabel: () => t('traffic-rules:direction'), headerIcon: 'fa:square-caret-down' }),
    target: useTruncatedTextColumn({ headerLabel: () => t('traffic-rules:target'), headerIcon: 'fa:at' }),
    directionB: useTextColumn({
      headerLabel: () => t('traffic-rules:direction'),
      headerIcon: 'fa:square-caret-down',
    }),
    object: useDoubleLinkColumn({ headerLabel: () => t('object') }),
    selectItem: useSelectItemColumn(),
  }
})
