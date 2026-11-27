import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useNumberColumn } from '@core/tables/column-definitions/number-column.ts'
import { useTagColumn } from '@core/tables/column-definitions/tag-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useAppliancePackageColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useTextColumn({ headerLabel: () => t('name'), flexible: true }),
    installedVersion: useNumberColumn({ headerLabel: () => t('appliance:installed-version') }),
    availableVersion: useNumberColumn({ headerLabel: () => t('appliance:available-version') }),
    status: useTagColumn({ headerLabel: () => t('status') }),
  }
})
