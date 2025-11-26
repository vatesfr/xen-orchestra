import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useSelectIdColumn } from '@core/tables/column-definitions/select-id-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useVmColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    vm: useLinkColumn({ headerLabel: () => t('vm') }),
    description: useTextColumn({ headerLabel: () => t('description') }),
    ipAddresses: useAddressColumn({ headerLabel: () => t('ip-addresses') }),
    vcpus: useNumberColumn({ headerLabel: () => t('vcpus') }),
    ram: useNumberColumn({ headerLabel: () => t('ram') }),
    diskSpace: useNumberColumn({ headerLabel: () => t('disk-space') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
    selectId: useSelectIdColumn(),
  }
})
