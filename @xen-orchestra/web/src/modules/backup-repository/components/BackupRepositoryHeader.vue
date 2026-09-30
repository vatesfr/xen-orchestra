<template>
  <BackupRepositoryBreadcrumbLink :br :icon />
  <BackupRepositoryHeaderBar :br :icon />
</template>

<script lang="ts" setup>
import BackupRepositoryBreadcrumbLink from '@/modules/backup-repository/components/header/BackupRepositoryBreadcrumbLink.vue'
import BackupRepositoryHeaderBar from '@/modules/backup-repository/components/header/BackupRepositoryHeaderBar.vue'
import { useXoBackupRepositoryParsedUrl } from '@/modules/backup-repository/composables/use-xo-backup-repository-parsed-url.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import { getBackupRepositoryIcon } from '@/modules/backup-repository/utils/xo-backup-repository.util.ts'
import { computed } from 'vue'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const parsedUrl = useXoBackupRepositoryParsedUrl(() => br)

const icon = computed(() => getBackupRepositoryIcon(br, parsedUrl.value?.type))
</script>
