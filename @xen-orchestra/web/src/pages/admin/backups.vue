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
import { watch } from 'vue'

useDefaultTab('/admin/backups', 'brs')

const { backupRepositories: brs } = useXoBackupRepositoryCollection()

watch(brs, value => {
  console.log(value)
})
</script>
