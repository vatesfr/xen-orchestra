import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column'
import { useI18n } from 'vue-i18n'

export const useNetworkColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    network: useLinkColumn({ headerLabel: () => t('name') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    vlan: useNumberColumn({ headerLabel: () => t('vlan') }),
    mtu: useNumberColumn({ headerLabel: () => t('mtu') }),
    defaultLockingMode: useTextColumn({ headerLabel: () => t('default-locking-mode') }),
    selectItem: useSelectItemColumn(),
  }
})
