<template>
  <UiCard class="backupTarget">
    <StorageRepositoriesTable :storage-repositories-targets />
    <BackupRepositoriesTable :backup-repositories-targets />
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositoriesTable from '@/components/backups/target/BackupRepositoriesTable.vue'
import StorageRepositoriesTable from '@/components/backups/target/StorageRepositoriesTable.vue'
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

const { getSrsByIds } = useXoSrCollection()
const { getBackupRepositoriesByIds } = useXoBackupRepositoryCollection()

const backupRepositoriesTargets = computed(() =>
  getBackupRepositoriesByIds(extractIdsFromSimplePattern(backupJob.remotes) as XoBackupRepository['id'][])
)

const storageRepositoriesTargets = computed(() => {
  if (!(backupJob.type === 'backup' && backupJob.srs)) {
    return []
  }

  return getSrsByIds(extractIdsFromSimplePattern(backupJob.srs) as XoSr['id'][])
})
</script>

<style lang="postcss" scoped>
.backupTarget {
  margin: 0.8rem;
  gap: 4rem;
}
</style>
