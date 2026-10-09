<template>
  <MenuItem
    v-tooltip="!canForgetBackupRepositories && forgetBackupRepositoriesErrorMessage"
    accent="danger"
    icon="action:forget"
    :disabled="!canForgetBackupRepositories"
    :busy="isForgettingBackupRepositories"
    @click="forgetBackupRepositories()"
  >
    {{ t('action:forget') }}
  </MenuItem>
</template>

<script lang="ts" setup>
import { useBackupRepositoryForget } from '@/modules/backup-repository/composables/use-backup-repository-forget.composable.ts'
import type { FrontXoBackupRepository } from '@/modules/backup-repository/remote-resources/use-xo-backup-repository-collection.ts'
import MenuItem from '@core/components/menu/MenuItem.vue'
import { vTooltip } from '@core/directives/tooltip.directive.ts'
import { useI18n } from 'vue-i18n'

const { br } = defineProps<{
  br: FrontXoBackupRepository
}>()

const { t } = useI18n()

const {
  forgetBackupRepositories,
  canForgetBackupRepositories,
  isForgettingBackupRepositories,
  forgetBackupRepositoriesErrorMessage,
} = useBackupRepositoryForget(() => [br])
</script>
