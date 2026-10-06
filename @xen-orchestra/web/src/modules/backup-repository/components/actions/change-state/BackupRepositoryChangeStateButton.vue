<template>
  <UiButton
    v-tooltip="!canChangeBackupRepositoryState && changeBackupRepositoryStateErrorMessage"
    size="medium"
    variant="tertiary"
    accent="brand"
    :disabled="!canChangeBackupRepositoryState"
    :left-icon="br.enabled ? 'status:disabled' : 'status:success-circle'"
    :busy="isChangingBackupRepositoryState"
    @click="changeBackupRepositoryState()"
  >
    {{ br.enabled ? t('action:disable') : t('action:enable') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useBackupRepositoryChangeState } from '@/modules/backup-repository/composables/use-backup-repository-change-state.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiButton from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const {
  changeBackupRepositoryState,
  canChangeBackupRepositoryState,
  isChangingBackupRepositoryState,
  changeBackupRepositoryStateErrorMessage,
} = useBackupRepositoryChangeState(() => br)
</script>
