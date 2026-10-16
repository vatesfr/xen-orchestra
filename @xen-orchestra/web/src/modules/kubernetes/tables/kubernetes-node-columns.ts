import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useKubernetesNodeColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useLinkColumn({ headerLabel: () => t('name') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    role: useTextColumn({ headerLabel: () => t('role') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    endpoint: useTextColumn({ headerLabel: () => t('ip-address') }),
    actions: useActionColumn({}),
  }
})
