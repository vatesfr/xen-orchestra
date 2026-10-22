<template>
  <BackupRepositoryChangeStateButton :br />
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
    <BackupRepositoryEditButton :br />
    <BackupRepositoryTestSpeedButton :br />
    <MenuSeparator />
    <BackupRepositoryForgetButton :br />
  </MenuList>
</template>

<script lang="ts" setup>
import BackupRepositoryTestSpeedButton from '@/modules/backup-repository/components/actions/benchmark/BackupRepositoryTestSpeedButton.vue'
import BackupRepositoryChangeStateButton from '@/modules/backup-repository/components/actions/change-state/BackupRepositoryChangeStateButton.vue'
import BackupRepositoryEditButton from '@/modules/backup-repository/components/actions/edit/BackupRepositoryEditButton.vue'
import BackupRepositoryForgetButton from '@/modules/backup-repository/components/actions/forget/BackupRepositoryForgetButton.vue'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuList from '@core/components/menu/MenuList.vue'
import MenuSeparator from '@core/components/menu/MenuSeparator.vue'
import UiButtonIcon from '@core/components/ui/button-icon/UiButtonIcon.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()
</script>
