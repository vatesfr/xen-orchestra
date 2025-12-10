<template>
  <UiCard>
    <UiCardTitle>{{ t('last-n-backup-archives', 3) }}</UiCardTitle>
    <VtsTable :state>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="run of backupArchives" :key="run.id">
          <BodyCells :item="run" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection'
import type { VmDashboardBackupArchive, XoVmDashboard } from '@/types/xo/vm-dashboard.type'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackuparchiveColumns } from '@core/tables/column-sets/vm-backup-archive-columns'
import { formatSizeRaw } from '@core/utils/size.util'
import { logicNot } from '@vueuse/math'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { vmDashboard } = defineProps<{
  vmDashboard: XoVmDashboard | undefined
  error: boolean
}>()

const { t } = useI18n()

const { useGetBackupRepositoryById, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()

const backupArchives = computed(() => vmDashboard?.backupsInfo.backupArchives ?? [])

const isEmpty = computed(() => backupArchives.value.length === 0)

const state = useTableState({
  busy: logicNot(areBackupRepositoriesReady) || !vmDashboard,
  error: hasBackupRepositoryFetchError,
  empty: isEmpty,
})

const { HeadCells, BodyCells } = useBackuparchiveColumns({
  body: (run: VmDashboardBackupArchive) => {
    const br = useGetBackupRepositoryById(run.backupRepository)

    return {
      date: r => r(run.timestamp),
      BackupRepository: r =>
        r({
          label: br?.value?.name ?? run.backupRepository,
          to: `/settings/remotes`,
          icon: br.value?.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected',
        }),
      sizeOnDisk: r => r(formatSizeRaw(run.size, 1).value, formatSizeRaw(run.size, 1).prefix),
    }
  },
})
</script>
