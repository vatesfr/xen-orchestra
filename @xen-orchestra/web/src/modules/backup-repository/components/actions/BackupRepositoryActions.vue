<template>
  <BackupRepositoryChangeStateButton :br />
  <VtsActionsMenu :label="t('more-actions')" size="medium">
    <BackupRepositoryMoreActions :br />
  </VtsActionsMenu>
</template>

<script lang="ts" setup>
import BackupRepositoryMoreActions from '@/modules/backup-repository/components/actions/BackupRepositoryMoreActions.vue'
import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsActionsMenu from '@core/components/menu/VtsActionsMenu.vue'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()
</script>
