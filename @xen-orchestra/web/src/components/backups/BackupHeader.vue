<template>
  <UiHeadBar icon="object:backup-job">
    {{ backupJob.name }}
  </UiHeadBar>
</template>

<script lang="ts" setup>
import type { XoBackupJob } from '@/remote-resources/use-xo-backup-job-collection'
import UiHeadBar from '@core/components/ui/head-bar/UiHeadBar.vue'

defineProps<{ backupJob: XoBackupJob }>()
</script>
