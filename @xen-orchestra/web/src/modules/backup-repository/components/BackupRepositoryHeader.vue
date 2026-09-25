<template>
  <BackupRepositoryBreadcrumbLink :br />
  <BackupRepositoryHeaderBar :br />
</template>

<script lang="ts" setup>
import BackupRepositoryBreadcrumbLink from '@/modules/backup-repository/components/header/BackupRepositoryBreadcrumbLink.vue'
import BackupRepositoryHeaderBar from '@/modules/backup-repository/components/header/BackupRepositoryHeaderBar.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'

defineProps<{
  br: FrontXoBackupRepository
}>()
</script>
