<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <BackupRepositoriesTable :brs :busy="!areBackupRepositoriesReady" :error="hasBackupRepositoryFetchError">
          <template #title-actions>
            <UiButton
              variant="primary"
              accent="brand"
              size="medium"
              left-icon="fa:plus"
              @click="openNewBackupRepositoryDrawer()"
            >
              {{ t('new') }}
            </UiButton>
          </template>
        </BackupRepositoriesTable>
      </UiCard>
    </div>

    <BackupRepositorySidePanel :br="selectedBr" @close="selectedBr = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import BackupRepositoriesTable from '@/modules/backup-repository/components/list/BackupRepositoriesTable.vue'
import BackupRepositorySidePanel from '@/modules/backup-repository/components/list/panel/BackupRepositorySidePanel.vue'
import { useNewBackupRepository } from '@/modules/backup-repository/composables/use-new-backup-repository.composable.ts'
import {
  type FrontXoBackupRepository,
  useXoBackupRepositoryCollection,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  brs: FrontXoBackupRepository[]
}>()

const { t } = useI18n()

const { openNewBackupRepositoryDrawer } = useNewBackupRepository()

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
