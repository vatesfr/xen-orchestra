<template>
  <UiButton
    v-tooltip="!canEditBackupRepository && editBackupRepositoryErrorMessage"
    size="medium"
    :variant
    accent="brand"
    left-icon="action:edit"
    :disabled="!canEditBackupRepository"
    :busy="isEditingBackupRepository"
    @click="editBackupRepository()"
  >
    {{ t('action:edit') }}
  </UiButton>
</template>

<script lang="ts" setup>
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import UiButton, { type ButtonVariant } from '@core/components/ui/button/UiButton.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br, variant = 'tertiary' } = defineProps<{
  br: FrontXoBackupRepository
  variant?: ButtonVariant
}>()

const { t } = useI18n()

const { editBackupRepository, canEditBackupRepository, isEditingBackupRepository, editBackupRepositoryErrorMessage } =
  useEditBackupRepository(() => br)
</script>
