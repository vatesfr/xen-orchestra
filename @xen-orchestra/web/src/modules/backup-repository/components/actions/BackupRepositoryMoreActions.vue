<template>
  <BackupRepositoryEditButton :br />
  <BackupRepositoryTestSpeedButton :br />
  <MenuSeparator />
  <BackupRepositoryForgetButton :br />
</template>

<script lang="ts" setup>
import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'

defineProps<{
  br: FrontXoBackupRepository
}>()
</script>
