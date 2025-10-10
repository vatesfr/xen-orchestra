<template>
  <UiCard class="backupTarget">
    <BackupRepositorTable :backup-repository-targets="backupRepositoryTargets" />
    <StorageRepositoryTable :storage-repository-targets="storageRepositoryTargets" />
  </UiCard>
</template>

<script setup lang="ts">
import BackupRepositorTable from '@/components/backups/target/BackupRepositoryTable.vue'
import StorageRepositoryTable from '@/components/backups/target/StorageRepositoryTable.vue'
import { useXoBackupRepositoryCollection } from '@/remote-resources/use-xo-br-collection'
import { useXoSrCollection } from '@/remote-resources/use-xo-sr-collection'
import type { XoBackupRepository } from '@/types/xo/br.type'
import type { XoSr } from '@/types/xo/sr.type'
import { extractIdsFromSimplePattern } from '@/utils/pattern.util'
import UiCard from '@core/components/ui/card/UiCard.vue'
import type { XoBackupJob } from '@vates/types'
import { computed } from 'vue'

const { backupJob } = defineProps<{
  backupJob: XoBackupJob
}>()

const { getSrsByIds } = useXoSrCollection()
const { getBackupRepositoriesByIds } = useXoBackupRepositoryCollection()

const backupRepositoryTargets = computed(() =>
  getBackupRepositoriesByIds(extractIdsFromSimplePattern(backupJob.remotes) as XoBackupRepository['id'][])
)

const storageRepositoryTargets = computed(() => {
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
