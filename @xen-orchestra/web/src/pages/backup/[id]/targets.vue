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
import { useXoBackupUtils } from '@/modules/backup/composables/xo-backup-utils.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup/remote-resources/use-xo-backup-job-collection.ts'
import {
  useXoBackupRepositoryCollection,
  type FrontXoBackupRepository,
} from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import {
  useXoSrCollection,
  type FrontXoSr,
} from '@/modules/storage-repository/remote-resources/use-xo-sr-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { getSrsByIds, areSrsReady, hasSrFetchError } = useXoSrCollection()
const { getBackupRepositoriesByIds, areBackupRepositoriesReady, hasBackupRepositoryFetchError } =
  useXoBackupRepositoryCollection()
const { getTargetIds } = useXoBackupUtils()

const backupRepositories = computed(() =>
  getBackupRepositoriesByIds(getTargetIds<FrontXoBackupRepository['id']>(backupJob.remotes))
)

const storageRepositories = computed(() => {
  if (backupJob.type !== 'backup') {
    return []
  }

  return getSrsByIds(getTargetIds<FrontXoSr['id']>(backupJob.srs))
})
</script>

<style lang="postcss" scoped>
.targets {
  margin: 0.8rem;
  gap: 4rem;
}
</style>
