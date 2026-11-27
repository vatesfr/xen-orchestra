<template>
  <VtsActionButton variant="tertiary" accent="brand" icon="fa:satellite" @click="restoreVmBackupArchive()">
    {{ t('action:restore') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useRestoreVmBackupArchive } from '@/modules/backup-archive/composables/use-restore-vm-backup-archive.composable.ts'
import type { FrontXoVmBackupArchive } from '@/modules/backup-archive/remote-resources/use-xo-vm-backup-archive-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { backupArchive } = defineProps<{
  backupArchive: FrontXoVmBackupArchive
}>()

const { t } = useI18n()

const { restoreVmBackupArchive } = useRestoreVmBackupArchive(() => backupArchive)
</script>
