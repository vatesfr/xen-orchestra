<template>
  <div class="backups" :class="{ mobile: uiStore.isMobile }">
    <BackupJobConfiguration />
  </div>
</template>

<script setup lang="ts">
import BackupJobConfiguration from '@/components/site/backups/job/BackupJob.vue'
import { useUiStore } from '@core/stores/ui.store'

const uiStore = useUiStore()
</script>
