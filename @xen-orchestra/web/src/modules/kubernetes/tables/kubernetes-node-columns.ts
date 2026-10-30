import { useKubernetesStatusColumn } from '@/modules/kubernetes/tables/column-definitions/kubernetes-status-column.ts'
import { defineColumns } from '@core/packages/table/define-columns.ts'
import { useActionColumn } from '@core/tables/column-definitions/action-column.ts'
import { useAddressColumn } from '@core/tables/column-definitions/address-column.ts'
import { useLinkColumn } from '@core/tables/column-definitions/link-column.ts'
import { useTextColumn } from '@core/tables/column-definitions/text-column.ts'
import { useI18n } from 'vue-i18n'

export const useKubernetesNodeColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    name: useLinkColumn({ headerLabel: () => t('name') }),
    status: useKubernetesStatusColumn({ headerLabel: () => t('status') }),
    role: useTextColumn({ headerLabel: () => t('role') }),
    version: useTextColumn({ headerLabel: () => t('version') }),
    ipAddresses: useAddressColumn({ headerLabel: () => t('ip-addresses') }),
    actions: useActionColumn({}),
  }
})
