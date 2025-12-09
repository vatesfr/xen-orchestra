import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import { useSelectItemColumn } from '@core/tables/column-definitions/select-item-column'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTruncatedTextColumn } from '@core/tables/column-definitions/truncated-text-column'
import { useI18n } from 'vue-i18n'

export const useHostColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    host: useLinkColumn({ headerLabel: () => t('host') }),
    description: useTruncatedTextColumn({ headerLabel: () => t('description') }),
    ipAddresses: useAddressColumn({ headerLabel: () => t('ip-addresses') }),
    tags: useTagColumn({ headerLabel: () => t('tags') }),
    selectItem: useSelectItemColumn(),
  }
})
