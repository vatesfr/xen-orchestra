<template>
  <MenuItem
    v-tooltip="!canEditBackupRepository && editBackupRepositoryErrorMessage"
    accent="neutral"
    icon="action:edit"
    :disabled="!canEditBackupRepository"
    :busy="isEditingBackupRepository"
    @click="editBackupRepository()"
  >
    {{ t('action:edit') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { editBackupRepository, canEditBackupRepository, isEditingBackupRepository, editBackupRepositoryErrorMessage } =
  useEditBackupRepository(() => br)
</script>
