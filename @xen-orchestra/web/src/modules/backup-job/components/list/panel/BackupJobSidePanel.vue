<template>
  <VtsSidePanel :has-selection="!!backupJob" @close="emit('close')" />
</template>

<script lang="ts" setup>
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsSidePanel from '@core/components/panel/VtsSidePanel.vue'

defineProps<{
  backupJob?: FrontAnyXoBackupJob
}>()

const emit = defineEmits<{
  close: []
}>()
</script>
