<template>
  <div class="backed-up-vms">
    <UiCard class="container">
      <BackupLogBackedUpVmsTable :backup-log />
    </UiCard>
  </div>
</template>

<script setup lang="ts">
import BackupLogBackedUpVmsTable from '@/modules/backup-log/components/backed-up-vms/BackupLogBackedUpVmsTable.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import UiCard from '@core/components/ui/card/UiCard.vue'

defineProps<{ backupLog: FrontXoBackupLog }>()
</script>

<style scoped lang="postcss">
.backed-up-vms {
  .container {
    height: fit-content;
    margin: 0.8rem;
  }
}
</style>
