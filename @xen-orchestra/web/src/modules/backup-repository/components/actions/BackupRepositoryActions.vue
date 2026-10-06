<template>
  <BackupRepositoryChangeStateButton :br />
  <UiButton
    size="medium"
    variant="tertiary"
    accent="brand"
    left-icon="action:edit"
    @click="openEditBackupRepositoryDrawer(br)"
  >
    {{ t('action:edit') }}
  </UiButton>
  <MenuList placement="bottom-end">
    <template #trigger="{ open }">
      <UiButtonIcon
        v-tooltip="{ placement: 'left', content: t('more-actions') }"
        accent="brand"
        icon="action:more-actions"
        size="medium"
        @click="open($event)"
      />
    </template>
    <BackupRepositoryTestSpeedButton :br />
    <MenuSeparator />
    <BackupRepositoryForgetButton :br />
  </MenuList>
</template>

<script lang="ts" setup>
import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/test-speed/BackupRepositoryTestSpeedButton.vue'
import { useEditBackupRepository } from '@/modules/backup-repository/composables/use-edit-backup-repository.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import UiButton from '@core/components/ui/button/UiButton.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const { openEditBackupRepositoryDrawer } = useEditBackupRepository()
</script>
