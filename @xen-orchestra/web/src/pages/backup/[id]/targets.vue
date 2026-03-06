<template>
  <UiCard class="targets">
    <StorageRepositoriesTargetsTable :busy="!areSrsReady" :error="hasSrFetchError" :storage-repositories />
    <BackupRepositoriesTargetsTable
      :busy="!areBackupRepositoriesReady"
      :error="hasBackupRepositoryFetchError"
      :backup-repositories
    />
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositoriesTargetsTable from '@/modules/backup/components/targets/BackupRepositoriesTargetsTable.vue'
import StorageRepositoriesTargetsTable from '@/modules/backup/components/targets/StorageRepositoriesTargetsTable.vue'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-br-collection.ts'
import { useXoSrCollection } from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import { extractIdsFromSimplePattern } from '@/shared/utils/pattern.util'
import UiCard from '@core/components/ui/card/UiCard.vue'
import type { XoBackupRepository, XoSr } from '@vates/types'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { getSrsByIds, areSrsReady, hasSrFetchError } = useXoSrCollection()
const { getBackupRepositoriesByIds, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()

const backupRepositories = computed(() =>
  getBackupRepositoriesByIds(extractIdsFromSimplePattern(backupJob.remotes) as XoBackupRepository['id'][])
)

const storageRepositories = computed(() => {
  if (backupJob.type !== 'backup') {
    return []
  }

  return getSrsByIds(extractIdsFromSimplePattern(backupJob.srs) as XoSr['id'][])
})
</script>

<style lang="postcss" scoped>
.targets {
  margin: 0.8rem;
  gap: 4rem;
}
</style>
