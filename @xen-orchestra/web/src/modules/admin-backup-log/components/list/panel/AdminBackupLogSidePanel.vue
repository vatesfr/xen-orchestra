<template>
  <VtsSidePanel :has-selection="!!backupLog" @close="emit('close')" />
</template>

<script lang="ts" setup>
import type { FrontXoBackupLog } from '@/modules/backup/remote-resources/use-xo-backup-log-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

const { backupLog } = defineProps<{
  backupLog?: FrontXoBackupLog
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
