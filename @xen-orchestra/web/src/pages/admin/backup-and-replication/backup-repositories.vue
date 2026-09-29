<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupRepositoriesTable :brs :busy="!areBackupRepositoriesReady" :error="hasBackupRepositoryFetchError" />
      </UiCard>
    </div>

    <BackupRepositorySidePanel :br="selectedBr" @close="selectedBr = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupRepositoriesTable from '@/modules/backup/components/repository/list/BackupRepositoriesTable.vue'
import BackupRepositorySidePanel from '@/modules/backup/components/repository/list/panel/BackupRepositorySidePanel.vue'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

defineProps<{
  brs: FrontXoBackupRepository[]
}>()

const { getBackupRepositoryById, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()

const selectedBr = useRouteQuery<FrontXoBackupRepository | undefined>('id', {
  toData: id => getBackupRepositoryById(id as FrontXoBackupRepository['id']),
  toQuery: br => br?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  gap: 0.8rem;
  margin: 0.8rem;
  display: flex;
  flex-direction: column;
}
</style>
