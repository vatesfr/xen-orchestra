<template>
  <VtsActionItems :actions="moreActions" />
</template>

<script lang="ts" setup>
import { useXoBackupJobActions } from '@/modules/backup-job/composables/use-xo-backup-job-actions.composable.ts'
import type { FrontAnyXoBackupJob } from '@/modules/backup-job/remote-resources/use-xo-backup-job-collection.ts'
import VtsActionItems from '@core/components/menu/VtsActionItems.vue'

const { backupJob } = defineProps<{
  backupJob: FrontAnyXoBackupJob
}>()

const { moreActions } = useXoBackupJobActions(() => backupJob)
</script>
