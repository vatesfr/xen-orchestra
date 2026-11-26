<template>
  <VtsContentSidePanel>
    <div class="container">
      <UiCard>
        <VmBackupArchivesTable
          :backup-archives
          :busy="!areBackupArchivesReady"
          :error="hasBackupRepositoryFetchError || hasBackupArchiveFetchError"
        />
      </UiCard>
    </div>

    <VmBackupArchiveSidePanel :backup-archive="selectedBackupArchive" @close="selectedBackupArchive = undefined" />
  </VtsContentSidePanel>
</template>

<script setup lang="ts">
import VmBackupArchiveSidePanel from '@/modules/backup-archive/components/list/panel/VmBackupArchiveSidePanel.vue'
import VmBackupArchivesTable from '@/modules/backup-archive/components/list/VmBackupArchivesTable.vue'
import {
  type FrontXoVmBackupArchive,
  useXoVmBackupArchiveCollection,
} from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsContentSidePanel from '@core/components/layout/VtsContentSidePanel.vue'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useRouteQuery } from '@core/composables/route-query.composable.ts'

const { backupRepositories, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()

const { backupArchives, areBackupArchivesReady, hasBackupArchiveFetchError, getBackupArchiveById } =
  useXoVmBackupArchiveCollection({ isEnabled: areBackupRepositoriesReady }, () =>
    backupRepositories.value.map(br => br.id)
  )

const selectedBackupArchive = useRouteQuery<FrontXoVmBackupArchive | undefined>('id', {
  toData: id => getBackupArchiveById(id as FrontXoVmBackupArchive['id']),
  toQuery: backupArchive => backupArchive?.id ?? '',
})
</script>

<style scoped lang="postcss">
.container {
  height: fit-content;
  margin: 0.8rem;
}
</style>
