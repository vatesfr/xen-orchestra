<template>
  <BackupRepositoryEditButton :br />
</template>

<script lang="ts" setup>
import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'

defineProps<{
  br: FrontXoBackupRepository
}>()
</script>
