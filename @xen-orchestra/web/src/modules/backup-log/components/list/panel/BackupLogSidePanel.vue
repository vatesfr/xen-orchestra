<template>
  <VtsSidePanel :has-selection="!!backupLog" @close="emit('close')">
    <template v-if="backupLog">
      <BackupLogInfosCard :backup-log />
      <BackupLogSizeAndSpeedCard :backup-log />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import BackupLogInfosCard from '@/modules/backup-log/components/list/panel/cards/BackupLogInfosCard.vue'
import BackupLogSizeAndSpeedCard from '@/modules/backup-log/components/list/panel/cards/BackupLogSizeAndSpeedCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup-log/remote-resources/use-xo-backup-log-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { backupLog } = defineProps<{
  backupLog?: FrontXoBackupLog
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
