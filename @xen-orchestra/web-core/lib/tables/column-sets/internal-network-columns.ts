import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column'
import { useI18n } from 'vue-i18n'

export const useInternalNetworkColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useLinkColumn({ headerLabel: () => t('name') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    mtu: useNumberColumn({ headerLabel: () => t('mtu') }),
    defaultLockingMode: useTextColumn({ headerLabel: () => t('default-locking-mode') }),
    selectId: useSelectIdColumn(),
  }
})
