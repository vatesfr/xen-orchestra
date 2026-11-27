<template>
  <UiCard>
    <UiTitle>{{ t('appliance:packages') }}</UiTitle>
    <VtsTable :state :pagination-bindings>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="appliancePackage of paginatedPackages" :key="appliancePackage.name">
          <BodyCells :item="appliancePackage" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script lang="ts" setup>
import type { AppliancePackage, AppliancePackageStatus } from '@/modules/appliance/types/appliance-package.type.ts'
import type { TagAccent } from '@core/components/ui/tag/UiTag.vue'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useAppliancePackageColumns } from '@core/tables/column-sets/appliance-package-columns.ts'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { packages } = defineProps<{
  packages: AppliancePackage[]
}>()

const { t } = useI18n()

const { pageRecords: paginatedPackages, paginationBindings } = usePagination('appliance-packages', () => packages)

const state = useTableState({
  empty: () => (packages.length === 0 ? t('no-data') : false),
})

const STATUS_ACCENTS: Record<AppliancePackageStatus, TagAccent> = {
  update: 'info',
  new: 'success',
  removed: 'danger',
  unchanged: 'neutral',
}

const statusLabels = computed<Record<AppliancePackageStatus, string>>(() => ({
  update: t('appliance:package-status:update'),
  new: t('appliance:package-status:new'),
  removed: t('appliance:package-status:removed'),
  unchanged: t('appliance:package-status:unchanged'),
}))

function formatVersion(version: string | undefined) {
  if (version === undefined) {
    return '-'
  }

  return version
}

const { HeadCells, BodyCells } = useAppliancePackageColumns({
  body: (appliancePackage: AppliancePackage) => ({
    name: r => r(appliancePackage.name),
    installedVersion: r => r(formatVersion(appliancePackage.installedVersion)),
    availableVersion: r => r(formatVersion(appliancePackage.availableVersion)),
    status: r => r(statusLabels.value[appliancePackage.status], STATUS_ACCENTS[appliancePackage.status]),
  }),
})
</script>
