<template>
  <UiButton
    v-tooltip="!canChangeBackupRepositoriesState && changeBackupRepositoriesStateErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canChangeBackupRepositoriesState"
    :left-icon="br.enabled ? 'status:disabled' : 'status:success-circle'"
    :busy="isChangingBackupRepositoriesState"
    @click="changeBackupRepositoriesState()"
  >
    {{ br.enabled ? t('action:disable') : t('action:connect') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useXoBackupRepositoryChangeStateJob } from '@/modules/backup-repository/jobs/xo-backup-repository-change-state.job.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
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
