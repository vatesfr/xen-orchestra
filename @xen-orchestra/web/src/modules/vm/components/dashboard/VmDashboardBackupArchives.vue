<template>
  <UiCard :has-error="isError">
    <UiCardTitle>{{ t('last-n-backup-archives', 3) }}</UiCardTitle>
    <VtsTable :state horizontal>
      <thead v-if="!isEmpty">
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
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-br-collection'
import type { VmDashboardBackupArchive, XoVmDashboard } from '@/modules/vm/types/vm-dashboard.type'
import { useXoRoutes } from '@/shared/remote-resources/use-xo-routes'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import UiCardTitle from '@core/components/ui/card-title/UiCardTitle.vue'
import { useTableState } from '@core/composables/table-state.composable'
import { useBackupArchiveColumns } from '@core/tables/column-sets/vm-backup-archive-columns'
import { formatSizeRaw } from '@core/utils/size.util'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

const { hasError, vmDashboard } = defineProps<{
  hasError: boolean
  vmDashboard: XoVmDashboard | undefined
}>()

const { t } = useI18n()

const { useGetBackupRepositoryById, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()

const { buildXo5Route } = useXoRoutes()

const backupArchives = computed(() => vmDashboard?.backupsInfo?.backupArchives ?? [])

const isEmpty = computed(() => backupArchives.value.length === 0)

const isError = computed(() => hasBackupRepositoryFetchError.value || hasError)

const xo5BackupRepositories = computed(() => buildXo5Route(`/settings/remotes`))

const areBackupArchivesReady = computed(() => areBackupRepositoriesReady.value && backupArchives.value !== undefined)

const state = useTableState({
  busy: () => !areBackupArchivesReady.value,
  error: () => (isError.value ? { type: 'error', message: t('error-no-data'), size: 'small' } : false),
  empty: () =>
    isEmpty.value
      ? {
          type: 'no-data',
          message: t('no-data-to-calculate'),
          size: 'small',
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
          icon: br.value?.enabled ? 'object:br:connected' : 'object:br:disconnected',
        }),
      sizeOnDisk: r => r(formatSizeRaw(archive.size, 1).value, formatSizeRaw(archive.size, 1).prefix),
    }
  },
})
</script>
