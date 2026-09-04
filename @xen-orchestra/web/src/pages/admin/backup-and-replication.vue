<template>
  <RouterView v-slot="{ Component }">
    <BackupAndReplicationHeader />
    <component :is="Component" :brs />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupAndReplicationHeader from '@/modules/admin/components/BackupAndReplicationHeader.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/backup-and-replication', 'backup-repositories')

const { backupRepositories: brs } = useXoBackupRepositoryCollection()
</script>
