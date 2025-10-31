<template>
  <UiCard class="targets">
    <StorageRepositoriesTable :is-ready="areSrsReady" :has-error="hasSrFetchError" :storage-repositories />
    <BackupRepositoriesTable
      :is-ready="areBackupRepositoriesReady"
      :has-error="hasBackupRepositoryFetchError"
      :backup-repositories
    />
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositoriesTable from '@/components/backups/targets/BackupRepositoriesTable.vue'
import StorageRepositoriesTable from '@/components/backups/targets/StorageRepositoriesTable.vue'
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import type { XoBackupRepository } from '@/types/xo/br.type'
import type { XoSr } from '@/types/xo/sr.type'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
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
