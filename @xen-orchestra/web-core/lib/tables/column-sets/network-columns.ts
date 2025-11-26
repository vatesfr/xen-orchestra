import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useNetworkColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    network: useLinkColumn({ headerLabel: () => t('name') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    vlan: useNumberColumn({ headerLabel: () => t('vlan') }),
    mtu: useNumberColumn({ headerLabel: () => t('mtu') }),
    defaultLockingMode: useLiteralColumn({ headerLabel: () => t('default-locking-mode') }),
    selectId: useSelectIdColumn(),
  }
})
