import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useLiteralColumn } from '@core/tables/column-definitions/literal-column.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVifColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    network: useLinkColumn({ headerLabel: () => t('network') }),
    device: useTextColumn({ headerLabel: () => t('device') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    ipsAddresses: useAddressColumn({ headerLabel: () => t('ip-addresses') }),
    macAddresses: useAddressColumn({ headerLabel: () => t('mac-addresses') }),
    mtu: useNumberColumn({ headerLabel: () => t('mtu') }),
    lockingMode: useLiteralColumn({ headerLabel: () => t('locking-mode') }),
    selectId: useSelectIdColumn(),
  }
})
