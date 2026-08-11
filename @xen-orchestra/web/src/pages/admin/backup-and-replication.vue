<template>
  <RouterView v-slot="{ Component }">
    <BackupsHeader />
    <component :is="Component" :brs />
  </RouterView>
</template>

<script lang="ts" setup>
import BackupsHeader from '@/modules/admin/components/BackupsHeader.vue'
import { useXoBackupRepositoryCollection } from '@/modules/backup/remote-resources/use-xo-backup-repository-collection.ts'
import { useDefaultTab } from '@core/composables/default-tab.composable.ts'

useDefaultTab('/admin/backup-and-replication', 'backup-repository')

const { backupRepositories: brs } = useXoBackupRepositoryCollection()
</script>
