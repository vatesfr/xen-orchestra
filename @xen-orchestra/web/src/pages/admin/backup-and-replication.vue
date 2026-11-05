<template>
  <RouterView v-slot="{ Component }">
    <BackupAndReplicationHeader />
    <component :is="Component" />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupAndReplicationHeader from '@/modules/admin/components/BackupAndReplicationHeader.vue'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/backup-and-replication', 'jobs')
</script>
