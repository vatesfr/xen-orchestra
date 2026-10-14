<template>
  <VtsSidePanel :has-selection="!!backupLog" @close="emit('close')">
    <template v-if="backupLog">
      <AdminBackupLogInfosCard :backup-log />
      <AdminBackupLogSizeAndSpeedCard :backup-log />
    </template>
  </VtsSidePanel>
</template>

<script lang="ts" setup>
import AdminBackupLogInfosCard from '@/modules/admin-backup-log/components/list/panel/cards/AdminBackupLogInfosCard.vue'
import AdminBackupLogSizeAndSpeedCard from '@/modules/admin-backup-log/components/list/panel/cards/AdminBackupLogSizeAndSpeedCard.vue'
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { backupLog } = defineProps<{
  backupLog?: FrontXoBackupLog
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
