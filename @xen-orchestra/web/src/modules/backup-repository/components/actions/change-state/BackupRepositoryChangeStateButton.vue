<template>
  <VtsActionButton
    :hint="changeBackupRepositoriesStateErrorMessage"
    variant="tertiary"
    accent="brand"
    :disabled="!canChangeBackupRepositoriesState"
    :icon="br.enabled ? 'action:disable' : 'action:connect'"
    :busy="isChangingBackupRepositoriesState"
    @click="changeBackupRepositoriesState()"
  >
    {{ br.enabled ? t('action:disable') : t('action:connect') }}
  </VtsActionButton>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import VtsActionButton from '@core/components/action-button/VtsActionButton.vue'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const {
  run: changeBackupRepositoriesState,
  canRun: canChangeBackupRepositoriesState,
  isRunning: isChangingBackupRepositoriesState,
  errorMessage: changeBackupRepositoriesStateErrorMessage,
} = useXoBackupRepositoryChangeStateJob(
  () => [br],
  () => !br.enabled
)
</script>
