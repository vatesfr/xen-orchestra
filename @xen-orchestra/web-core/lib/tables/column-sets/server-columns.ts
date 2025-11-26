import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useStatusColumn } from '@core/tables/column-definitions/status-column.ts'
import { useI18n } from 'vue-i18n'

export const useServerColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    label: useLinkColumn({ headerLabel: () => t('pool') }),
    host: useAddressColumn({ headerLabel: () => t('ip-address') }),
    status: useStatusColumn({ headerLabel: () => t('status') }),
    primaryHost: useLinkColumn({ headerLabel: () => t('master'), headerIcon: 'fa:server' }),
    selectId: useSelectIdColumn(),
  }
})
