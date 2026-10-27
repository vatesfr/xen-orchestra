import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column.ts'
import { useI18n } from 'vue-i18n'

export const usePluginColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    plugin: useLinkColumn({ headerLabel: () => t('plugin') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    loaded: useStatusColumn({ headerLabel: () => t('loaded') }),
    autoload: useStatusColumn({ headerLabel: () => t('load-at-startup') }),
    actions: useActionColumn({}),
  }
})
