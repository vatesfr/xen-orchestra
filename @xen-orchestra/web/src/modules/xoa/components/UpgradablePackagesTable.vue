<template>
  <UiTitle>{{ t('patches:n-available', packages.length) }}</UiTitle>

  <VtsTable :state :pagination-bindings sticky="right">
    <thead>
      <tr>
        <HeadCells />
      </tr>
    </thead>
    <tbody>
      <VtsRow v-for="upgradablePackage of paginatedPackages" :key="upgradablePackage.name">
        <BodyCells :item="upgradablePackage" />
      </VtsRow>
    </tbody>
  </VtsTable>
</template>

<script setup lang="ts">
import { useXoPackageUpgradeJob } from '@/modules/xoa/jobs/xo-package-upgrade.job.ts'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable.ts'
import { useTableState } from '@core/composables/table-state.composable.ts'
import { useUpgradablePackageColumns } from '@core/tables/column-sets/upgradable-package-columns.ts'
import type { UpgradablePackage } from '@vates/types'
import { useI18n } from 'vue-i18n'

const { packages, busy, error } = defineProps<{
  packages: UpgradablePackage[]
  busy: boolean
  error: boolean
}>()

const { t } = useI18n()

const { pageRecords: paginatedPackages, paginationBindings } = usePagination('upgradable-packages', () => packages)

const state = useTableState({
  busy: () => busy,
  error: () => error,
  empty: () => (packages.length === 0 ? { type: 'all-done', message: t('patches-up-to-date') } : false),
})

const { HeadCells, BodyCells } = useUpgradablePackageColumns({
  body: (upgradablePackage: UpgradablePackage) => {
    // the job is shared by all rows (one apt operation at a time): rows are disabled, not busy
    const { run, canRun } = useXoPackageUpgradeJob(upgradablePackage.name)

    return {
      name: r => r(upgradablePackage.name),
      version: r => r(`${upgradablePackage.installedVersion} → ${upgradablePackage.version}`),
      description: r => r(upgradablePackage.description),
      upgrade: r => r(t('action:update'), () => run(), { disabled: !canRun.value }),
    }
  },
})
</script>
