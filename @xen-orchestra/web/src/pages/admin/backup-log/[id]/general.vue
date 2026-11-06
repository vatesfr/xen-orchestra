<template>
  <VtsColumns extra-space-around>
    <VtsColumn>
      <BackupLogGeneralInfoCard :backup-log />
    </VtsColumn>
    <VtsColumn>
      <BackupLogGeneralScheduleCard :backup-log />
    </VtsColumn>
  </VtsColumns>
</template>

<script setup lang="ts">
import BackupLogGeneralInfoCard from '@/modules/backup-log/components/general/BackupLogGeneralInfoCard.vue'
import BackupLogGeneralScheduleCard from '@/modules/backup-log/components/general/BackupLogGeneralScheduleCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsColumn from '@core/components/column/VtsColumn.vue'
import VtsColumns from '@core/components/columns/VtsColumns.vue'

defineProps<{ backupLog: FrontXoBackupLog }>()
</script>
