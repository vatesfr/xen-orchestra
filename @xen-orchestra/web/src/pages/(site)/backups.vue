<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <UiCard class="container">
      <BackupJobsTable :backup-jobs :has-error />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import BackupJobsTable from '@/components/site/backups/BackupJobsTable.vue'
import { useXoMetadataBackupsCollection } from '@/remote-resources/use-xo-metadata-backups-collection.ts'
import { useXoMirrorBackupsCollection } from '@/remote-resources/use-xo-mirror-backups-collection.ts'
import { useXoVmBackupsCollection } from '@/remote-resources/use-xo-vm-backups-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'
import { useUiStore } from '@core/stores/ui.store'
import { logicOr } from '@vueuse/math'
import { computed } from 'vue'

const uiStore = useUiStore()

const { vmBackups, hasVmBackupFetchError } = useXoVmBackupsCollection()
const { metadataBackups, hasMetadataBackupFetchError } = useXoMetadataBackupsCollection()
const { mirrorBackups, hasMirrorBackupFetchError } = useXoMirrorBackupsCollection()

const backupJobs = computed(() =>
  [...vmBackups.value, ...metadataBackups.value, ...mirrorBackups.value].sort((backup1, backup2) =>
    backup1.name.localeCompare(backup2.name)
  )
)

const hasError = logicOr(hasVmBackupFetchError, hasMetadataBackupFetchError, hasMirrorBackupFetchError)
</script>

<style scoped lang="postcss">
.backups {
  &:not(.mobile) {
    display: grid;
    grid-template-columns: minmax(0, 1fr);
  }

  .container {
    height: fit-content;
    gap: 4rem;
    margin: 0.8rem;
  }
}
</style>
