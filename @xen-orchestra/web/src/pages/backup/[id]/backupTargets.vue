<template>
  <UiCard>
    <SpaceTable :backup-repository-targets="backupRepositoryTargets" />
    <SpaceTable :storage-repository-targets="storageRepositoryTargets" />
  </UiCard>
</template>

<script setup lang="ts">
import SpaceTable from '@/components/backups/target/spaceTable.vue'
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
