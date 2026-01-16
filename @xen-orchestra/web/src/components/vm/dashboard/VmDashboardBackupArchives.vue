<template>
  <UiCard :has-error="error">
    <UiCardTitle>{{ t('last-n-backup-archives', 3) }}</UiCardTitle>
    <VtsTable :state>
      <thead>
        <tr>
          <HeadCells />
        </tr>
      </thead>
      <tbody>
        <VtsRow v-for="backupArchive of backupArchives" :key="backupArchive.id">
          <BodyCells :item="backupArchive" />
        </VtsRow>
      </tbody>
    </VtsTable>
  </UiCard>
</template>

<script setup lang="ts">
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection'
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import type { VmDashboardBackupArchive, XoVmDashboard } from '@/types/xo/vm-dashboard.type'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupArchiveColumns } from '@core/tables/column-sets/vm-backup-archive-columns'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { error, vmDashboard } = defineProps<{
  vmDashboard: XoVmDashboard | undefined
  error: boolean
}>()

const { t } = useI18n()

const { useGetBackupRepositoryById, areBackupRepositoriesReady } = useXoBackupRepositoryCollection()

const { buildXo5Route } = useXoRoutes()

const backupArchives = computed(() => vmDashboard?.backupsInfo?.backupArchives)

const isEmpty = computed(() => backupArchives?.value?.length === 0)

const xo5BackupRepositories = computed(() => buildXo5Route(`/settings/remotes`))

const areBackupArchivesReady = computed(() => !areBackupRepositoriesReady.value || backupArchives.value === undefined)

const state = useTableState({
  busy: () => areBackupArchivesReady.value,
  empty: () =>
    isEmpty.value
      ? {
          type: 'no-result',
          message: t('no-data-to-calculate'),
          size: 'small',
          format: 'compact',
        }
      : false,
})

const { HeadCells, BodyCells } = useBackupArchiveColumns({
  body: (archive: VmDashboardBackupArchive) => {
    const br = useGetBackupRepositoryById(archive.backupRepository)

    return {
      date: r => r(archive.timestamp),
      backupRepository: r =>
        r({
          label: br?.value?.name ?? archive.backupRepository,
          href: xo5BackupRepositories.value,
          icon: br.value?.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected',
        }),
      sizeOnDisk: r => r(formatSizeRaw(archive.size, 1).value, formatSizeRaw(archive.size, 1).prefix),
    }
  },
})
</script>
