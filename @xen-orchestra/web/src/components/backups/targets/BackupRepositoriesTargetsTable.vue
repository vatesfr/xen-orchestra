<template>
  <div class="backup-repositories-targets-table">
    <UiTitle>
      {{ t('backup-repositories') }}
    </UiTitle>
    <div class="container">
      <div class="table-actions">
        <UiQuerySearchBar @search="value => (searchQuery = value)" />
      </div>

      <VtsTable :busy="!isReady" :error="hasError" :empty="emptyMessage" :pagination-bindings>
        <thead>
          <tr>
            <HeadCells />
          </tr>
        </thead>
        <tbody>
          <VtsRow v-for="repository of paginatedRepositories" :key="repository.id">
            <BodyCells :item="repository" />
          </VtsRow>
        </tbody>
      </VtsTable>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useXoRoutes } from '@/remote-resources/use-xo-routes'
import type { IconName } from '@core/icons'
import VtsRow from '@core/components/table/VtsRow.vue'
import VtsTable from '@core/components/table/VtsTable.vue'
import UiQuerySearchBar from '@core/components/ui/query-search-bar/UiQuerySearchBar.vue'
import UiTitle from '@core/components/ui/title/UiTitle.vue'
import { usePagination } from '@core/composables/pagination.composable'
import { defineColumns } from '@core/packages/table/define-columns'
import { useLinkColumn } from '@core/tables/column-definitions/link-column'
import type { XoBackupRepository } from '@vates/types'
import { computed, ref } from 'vue'
import { useI18n } from 'vue-i18n'

const { backupRepositories } = defineProps<{
  backupRepositories: XoBackupRepository[]
  isReady: boolean
  hasError: boolean
}>()

const { t } = useI18n()

const searchQuery = ref('')

const filteredRepositories = computed(() => {
  const searchTerm = searchQuery.value.trim().toLocaleLowerCase()

  if (!searchTerm) {
    return backupRepositories
  }

  return backupRepositories.filter(backupRepository =>
    Object.values(backupRepository).some(value => String(value).toLocaleLowerCase().includes(searchTerm))
  )
})

const emptyMessage = computed(() => {
  if (backupRepositories.length === 0) {
    return t('no-backup-repositories-detected')
  }

  if (filteredRepositories.value.length === 0) {
    return t('no-result')
  }

  return undefined
})

const { pageRecords: paginatedRepositories, paginationBindings } = usePagination(
  'backup-repositories-targets',
  filteredRepositories
)

function getBackupRepositoryIcon(backupRepository: XoBackupRepository): IconName {
  return backupRepository.enabled ? 'object:backup-repository:connected' : 'object:backup-repository:disconnected'
}

const useColumns = defineColumns(() => {
  const { t } = useI18n()

  return {
    backupRepositoy: useLinkColumn({ headerLabel: () => t('backup-repository') }),
  }
})

const { HeadCells, BodyCells } = useColumns({
  body: (br: XoBackupRepository) => {
    const { buildXo5Route } = useXoRoutes()

    const href = computed(() => buildXo5Route('/settings/remotes'))
    const statusIcon = computed(() => getBackupRepositoryIcon(br))

    return {
      backupRepositoy: r => r({ label: br.name, href: href.value, icon: statusIcon.value }),
    }
  },
})
</script>

<style lang="postcss" scoped>
.backup-repositories-targets-table,
.table-actions,
.container {
  display: flex;
  flex-direction: column;
}

.backup-repositories-targets-table {
  gap: 2.4rem;

  .container,
  .table-actions {
    gap: 0.8rem;
  }
}
</style>
