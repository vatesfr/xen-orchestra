<template>
  <div class="scroll-container">
    <VtsColumns extra-space-around>
      <VtsColumn>
        <BackupLogGeneralInfoCard :backup-log />
      </VtsColumn>
      <VtsColumn>
        <BackupLogGeneralScheduleCard :backup-log />
      </VtsColumn>
    </VtsColumns>
  </div>
</template>

<script setup lang="ts">
import BackupLogGeneralInfoCard from '@/modules/backup-log/components/general/BackupLogGeneralInfoCard.vue'
import BackupLogGeneralScheduleCard from '@/modules/backup-log/components/general/BackupLogGeneralScheduleCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ backupLog: FrontXoBackupLog }>()
</script>

<style lang="postcss" scoped>
.scroll-container {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}
</style>
