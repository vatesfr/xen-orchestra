import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const usePifColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    network: useLinkColumn({ headerLabel: () => t('network') }),
    device: useTextColumn({ headerLabel: () => t('device') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    vlan: useNumberColumn({ headerLabel: () => t('vlan') }),
    ip: useAddressColumn({ headerLabel: () => t('ip-address') }),
    mac: useAddressColumn({ headerLabel: () => t('mac-address') }),
    mode: useTextColumn({ headerLabel: () => t('mode') }),
    selectItem: useSelectItemColumn(),
  }
})
