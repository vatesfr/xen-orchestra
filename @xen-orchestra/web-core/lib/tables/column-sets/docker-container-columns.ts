import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useCodeColumn } from '@core/tables/column-definitions/code-column.ts'
import { useDateColumn } from '@core/tables/column-definitions/date-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { usePercentColumn } from '@core/tables/column-definitions/percent-column.ts'
import { useStackedTextColumn } from '@core/tables/column-definitions/stacked-text-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useI18n } from 'vue-i18n'

export const useDockerContainerColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useStackedTextColumn({ headerLabel: () => t('name') }),
    state: useTagColumn({ headerLabel: () => t('state') }),
    image: useCodeColumn({ headerLabel: () => t('image') }),
    ports: useTagColumn({ headerLabel: () => t('ports') }),
    // `docker stats` semantics: 100% is one full CPU
    cpu: usePercentColumn({ headerLabel: () => t('cpu') }),
    memory: useNumberColumn({ headerLabel: () => t('memory') }),
    uptime: useDateColumn({ headerLabel: () => t('uptime') }),
    actions: useActionColumn({}),
  }
})
